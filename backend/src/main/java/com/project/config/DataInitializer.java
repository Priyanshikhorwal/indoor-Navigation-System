package com.project.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.entity.*;
import com.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking if database needs to be seeded...");

        boolean usersEmpty = userRepository.count() == 0;
        boolean buildingsEmpty = buildingRepository.count() == 0;

        if (!usersEmpty && !buildingsEmpty) {
            log.info("Database already contains users and buildings. Skipping seeding.");
            return;
        }

        log.info("Seeding database with sample data (usersEmpty={}, buildingsEmpty={})...", usersEmpty, buildingsEmpty);
        
        ObjectMapper mapper = new ObjectMapper();
        ClassPathResource resource = new ClassPathResource("sample-data.json");
        
        try (InputStream inputStream = resource.getInputStream()) {
            Map<String, Object> data = mapper.readValue(inputStream, new TypeReference<Map<String, Object>>() {});
            
            // 1. Seed Users
            if (usersEmpty) {
                List<Map<String, String>> jsonUsers = (List<Map<String, String>>) data.get("users");
                for (Map<String, String> u : jsonUsers) {
                    User user = User.builder()
                            .email(u.get("email"))
                            .password(passwordEncoder.encode(u.get("password")))
                            .role(u.get("role"))
                            .build();
                    userRepository.save(user);
                    log.info("Created user: {}", user.getEmail());
                }
            } else {
                log.info("Users already exist. Skipping user seeding.");
            }

            // 2. Seed Navigation Data
            if (buildingsEmpty) {
                // 2. Seed Buildings
                Map<String, Building> buildingMap = new HashMap<>();
                List<Map<String, String>> jsonBuildings = (List<Map<String, String>>) data.get("buildings");
                for (Map<String, String> b : jsonBuildings) {
                    Building building = new Building();
                    building.setName(b.get("name"));
                    building.setDescription(b.get("description"));
                    building = buildingRepository.save(building);
                    buildingMap.put(building.getName(), building);
                    log.info("Created building: {}", building.getName());
                }

                // 3. Seed Floors
                Map<String, Floor> floorMap = new HashMap<>();
                List<Map<String, Object>> jsonFloors = (List<Map<String, Object>>) data.get("floors");
                for (Map<String, Object> f : jsonFloors) {
                    String buildingName = (String) f.get("buildingName");
                    Building building = buildingMap.get(buildingName);
                    if (building == null) {
                        log.error("Building not found for name: {}", buildingName);
                        continue;
                    }
                    
                    Floor floor = new Floor();
                    floor.setBuilding(building);
                    floor.setFloorNumber((Integer) f.get("floorNumber"));
                    floor.setFloorName((String) f.get("floorName"));
                    floor.setMapImageUrl((String) f.get("mapImageUrl"));
                    floor = floorRepository.save(floor);
                    
                    // Key format: buildingName + "_" + floorNumber
                    String key = buildingName + "_" + floor.getFloorNumber();
                    floorMap.put(key, floor);
                    log.info("Created floor: {} under building: {}", floor.getFloorName(), buildingName);
                }

                // 4. Seed Locations
                Map<String, Location> locationMap = new HashMap<>();
                List<Map<String, Object>> jsonLocations = (List<Map<String, Object>>) data.get("locations");
                for (Map<String, Object> l : jsonLocations) {
                    String buildingName = (String) l.get("buildingName");
                    Integer floorNumber = (Integer) l.get("floorNumber");
                    String floorKey = buildingName + "_" + floorNumber;
                    Floor floor = floorMap.get(floorKey);
                    if (floor == null) {
                        log.error("Floor not found for key: {}", floorKey);
                        continue;
                    }

                    Location location = new Location();
                    location.setName((String) l.get("name"));
                    location.setDescription((String) l.get("description"));
                    location.setXCoordinate((Integer) l.get("xCoordinate"));
                    location.setYCoordinate((Integer) l.get("yCoordinate"));
                    location.setFloor(floor);
                    location.setType((String) l.get("type"));
                    location = locationRepository.save(location);
                    locationMap.put(location.getName(), location);
                    log.info("Created location: {}", location.getName());
                }

                // 5. Seed Path Connections
                List<Map<String, Object>> jsonConnections = (List<Map<String, Object>>) data.get("connections");
                for (Map<String, Object> c : jsonConnections) {
                    String srcName = (String) c.get("sourceName");
                    String destName = (String) c.get("destinationName");
                    Location source = locationMap.get(srcName);
                    Location destination = locationMap.get(destName);
                    
                    if (source == null || destination == null) {
                        log.error("Could not find locations for connection between '{}' and '{}'", srcName, destName);
                        continue;
                    }

                    PathConnection pc = new PathConnection();
                    pc.setSourceLocation(source);
                    pc.setDestinationLocation(destination);
                    
                    Double distance = null;
                    if (c.containsKey("distance") && c.get("distance") != null) {
                        Object distVal = c.get("distance");
                        if (distVal instanceof Number) {
                            distance = ((Number) distVal).doubleValue();
                        }
                    }
                    if (distance == null) {
                        // Calculate Euclidean distance automatically
                        distance = Math.sqrt(Math.pow(source.getXCoordinate() - destination.getXCoordinate(), 2) +
                                             Math.pow(source.getYCoordinate() - destination.getYCoordinate(), 2));
                    }
                    pc.setDistance(distance);
                    
                    if (c.containsKey("isAccessible")) {
                        pc.setIsAccessible((Boolean) c.get("isAccessible"));
                    } else {
                        pc.setIsAccessible(true);
                    }
                    
                    if (c.containsKey("isBidirectional")) {
                        pc.setIsBidirectional((Boolean) c.get("isBidirectional"));
                    } else {
                        pc.setIsBidirectional(true);
                    }
                    
                    if (c.containsKey("directionType")) {
                        pc.setDirectionType((String) c.get("directionType"));
                    } else {
                        pc.setDirectionType("BOTH");
                    }
                    
                    pathConnectionRepository.save(pc);
                    log.info("Created connection between '{}' and '{}' with distance {}", srcName, destName, distance);
                }
                log.info("Database seeding completed successfully!");
            } else {
                log.info("Buildings already exist. Skipping navigation data seeding.");
            }
        } catch (Exception e) {
            log.error("Error occurred while seeding database", e);
            throw e;
        }
    }
}

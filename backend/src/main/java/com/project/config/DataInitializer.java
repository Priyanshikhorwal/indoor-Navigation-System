package com.project.config;

import com.project.entity.*;
import com.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking if database needs to be seeded...");

        // 1. Seed the single admin user — idempotent, never creates duplicates
        if (!userRepository.existsByEmail(adminEmail)) {
            userRepository.save(new User(null, adminEmail, passwordEncoder.encode(adminPassword), "ROLE_ADMIN"));
            log.info("Created admin user: {}", adminEmail);
        } else {
            log.info("Admin user already exists, skipping creation.");
        }

        // Seed default user for development/testing
        if (!userRepository.existsByEmail("user@example.com")) {
            userRepository.save(new User(null, "user@example.com", passwordEncoder.encode("userpassword"), "ROLE_USER"));
            log.info("Created default test user.");
        }


        // Check if navigation data is already seeded
        if (floorRepository.count() > 0 && roomRepository.count() > 0 && nodeRepository.count() > 0) {
            log.info("Database already contains rooms and nodes. Skipping navigation data seeding.");
            return;
        }

        log.info("Seeding building navigation blueprint database...");

        // 2. Seed Single Building
        Building building = new Building();
        building.setName("Smart Campus Block");
        building.setDescription("Central College Campus Academic Block");
        building = buildingRepository.save(building);

        // 3. Seed Floors (Ground, 1st, 2nd)
        Floor groundFloor = floorRepository.save(new Floor(null, building, 0, "Ground Floor", "/uploads/ground_floor.svg"));
        Floor firstFloor = floorRepository.save(new Floor(null, building, 1, "First Floor", "/uploads/first_floor.svg"));
        Floor secondFloor = floorRepository.save(new Floor(null, building, 2, "Second Floor", "/uploads/second_floor.svg"));

        log.info("Seeded floors: Ground Floor, First Floor, Second Floor");

        // 4. Seed Rooms
        Map<String, Room> roomMap = new HashMap<>();

        // Ground Floor rooms
        roomMap.put("Reception", roomRepository.save(new Room(null, "Reception", "Visitor check-in & assistance desk", "ROOM", groundFloor)));
        roomMap.put("Admin Office", roomRepository.save(new Room(null, "Admin Office", "Administration & faculty office", "OFFICE", groundFloor)));
        roomMap.put("Room G101", roomRepository.save(new Room(null, "Room G101", "Ground floor classroom G101", "ROOM", groundFloor)));
        roomMap.put("Room G102", roomRepository.save(new Room(null, "Room G102", "Ground floor classroom G102", "ROOM", groundFloor)));
        roomMap.put("Stairs G", roomRepository.save(new Room(null, "Stairs G", "Ground floor stairwell access", "STAIRS", groundFloor)));
        roomMap.put("Lift G", roomRepository.save(new Room(null, "Lift G", "Ground floor elevator cabin", "LIFT", groundFloor)));
        roomMap.put("Entry/Exit", roomRepository.save(new Room(null, "Entry/Exit", "Building main entrance and exit", "ENTRY_EXIT", groundFloor)));
        roomMap.put("Corridor G", roomRepository.save(new Room(null, "Corridor G", "Ground floor main access corridor", "CORRIDOR", groundFloor)));

        // First Floor rooms
        roomMap.put("Classroom 101", roomRepository.save(new Room(null, "Classroom 101", "First floor lecture classroom 101", "ROOM", firstFloor)));
        roomMap.put("Classroom 102", roomRepository.save(new Room(null, "Classroom 102", "First floor lecture classroom 102", "ROOM", firstFloor)));
        roomMap.put("Lab 1", roomRepository.save(new Room(null, "Lab 1", "First floor computer engineering lab 1", "LAB", firstFloor)));
        roomMap.put("Lab 2", roomRepository.save(new Room(null, "Lab 2", "First floor physics & electronics lab 2", "LAB", firstFloor)));
        roomMap.put("Faculty Room", roomRepository.save(new Room(null, "Faculty Room", "Faculty workspace and cabins", "OFFICE", firstFloor)));
        roomMap.put("Stairs 1", roomRepository.save(new Room(null, "Stairs 1", "First floor stairwell access", "STAIRS", firstFloor)));
        roomMap.put("Lift 1", roomRepository.save(new Room(null, "Lift 1", "First floor elevator cabin", "LIFT", firstFloor)));
        roomMap.put("Corridor 1", roomRepository.save(new Room(null, "Corridor 1", "First floor main access corridor", "CORRIDOR", firstFloor)));

        // Second Floor rooms
        roomMap.put("Library", roomRepository.save(new Room(null, "Library", "Main reference library & study hall", "ROOM", secondFloor)));
        roomMap.put("Seminar Hall", roomRepository.save(new Room(null, "Seminar Hall", "Auditorium and presentation hall", "ROOM", secondFloor)));
        roomMap.put("Server Room", roomRepository.save(new Room(null, "Server Room", "Main network server & IT room", "ROOM", secondFloor)));
        roomMap.put("Research Lab", roomRepository.save(new Room(null, "Research Lab", "Advanced post-graduate research lab", "LAB", secondFloor)));
        roomMap.put("Stairs 2", roomRepository.save(new Room(null, "Stairs 2", "Second floor stairwell access", "STAIRS", secondFloor)));
        roomMap.put("Lift 2", roomRepository.save(new Room(null, "Lift 2", "Second floor elevator cabin", "LIFT", secondFloor)));
        roomMap.put("Corridor 2", roomRepository.save(new Room(null, "Corridor 2", "Second floor main access corridor", "CORRIDOR", secondFloor)));

        log.info("Seeded rooms directory.");

        // 5. Seed Nodes (Coordinate points)
        Map<String, Node> nodeMap = new HashMap<>();

        // Helper to register node
        registerNode(nodeMap, "ReceptionNode", 250, 120, groundFloor, roomMap.get("Reception"));
        registerNode(nodeMap, "AdminOfficeNode", 550, 120, groundFloor, roomMap.get("Admin Office"));
        registerNode(nodeMap, "RoomG101Node", 250, 380, groundFloor, roomMap.get("Room G101"));
        registerNode(nodeMap, "RoomG102Node", 550, 380, groundFloor, roomMap.get("Room G102"));
        registerNode(nodeMap, "StairsGNode", 100, 250, groundFloor, roomMap.get("Stairs G"));
        registerNode(nodeMap, "LiftGNode", 700, 250, groundFloor, roomMap.get("Lift G"));
        registerNode(nodeMap, "EntryExitNode", 400, 450, groundFloor, roomMap.get("Entry/Exit"));
        registerNode(nodeMap, "CorridorGLeft", 250, 250, groundFloor, roomMap.get("Corridor G"));
        registerNode(nodeMap, "CorridorGCenter", 400, 250, groundFloor, roomMap.get("Corridor G"));
        registerNode(nodeMap, "CorridorGRight", 550, 250, groundFloor, roomMap.get("Corridor G"));

        // First Floor Nodes
        registerNode(nodeMap, "Classroom101Node", 200, 120, firstFloor, roomMap.get("Classroom 101"));
        registerNode(nodeMap, "Classroom102Node", 400, 120, firstFloor, roomMap.get("Classroom 102"));
        registerNode(nodeMap, "Lab1Node", 600, 120, firstFloor, roomMap.get("Lab 1"));
        registerNode(nodeMap, "Lab2Node", 250, 380, firstFloor, roomMap.get("Lab 2"));
        registerNode(nodeMap, "FacultyRoomNode", 550, 380, firstFloor, roomMap.get("Faculty Room"));
        registerNode(nodeMap, "Stairs1Node", 100, 250, firstFloor, roomMap.get("Stairs 1"));
        registerNode(nodeMap, "Lift1Node", 700, 250, firstFloor, roomMap.get("Lift 1"));
        registerNode(nodeMap, "Corridor1Left", 250, 250, firstFloor, roomMap.get("Corridor 1"));
        registerNode(nodeMap, "Corridor1Center", 400, 250, firstFloor, roomMap.get("Corridor 1"));
        registerNode(nodeMap, "Corridor1Right", 550, 250, firstFloor, roomMap.get("Corridor 1"));

        // Second Floor Nodes
        registerNode(nodeMap, "LibraryNode", 250, 120, secondFloor, roomMap.get("Library"));
        registerNode(nodeMap, "SeminarHallNode", 550, 120, secondFloor, roomMap.get("Seminar Hall"));
        registerNode(nodeMap, "ServerRoomNode", 250, 380, secondFloor, roomMap.get("Server Room"));
        registerNode(nodeMap, "ResearchLabNode", 550, 380, secondFloor, roomMap.get("Research Lab"));
        registerNode(nodeMap, "Stairs2Node", 100, 250, secondFloor, roomMap.get("Stairs 2"));
        registerNode(nodeMap, "Lift2Node", 700, 250, secondFloor, roomMap.get("Lift 2"));
        registerNode(nodeMap, "Corridor2Left", 250, 250, secondFloor, roomMap.get("Corridor 2"));
        registerNode(nodeMap, "Corridor2Center", 400, 250, secondFloor, roomMap.get("Corridor 2"));
        registerNode(nodeMap, "Corridor2Right", 550, 250, secondFloor, roomMap.get("Corridor 2"));

        log.info("Seeded node coordinates.");

        // 6. Seed Edges (Path connections)
        
        // Ground Floor Connections
        linkNodes(nodeMap, "ReceptionNode", "CorridorGLeft", true);
        linkNodes(nodeMap, "AdminOfficeNode", "CorridorGRight", true);
        linkNodes(nodeMap, "RoomG101Node", "CorridorGLeft", true);
        linkNodes(nodeMap, "RoomG102Node", "CorridorGRight", true);
        linkNodes(nodeMap, "StairsGNode", "CorridorGLeft", true);
        linkNodes(nodeMap, "LiftGNode", "CorridorGRight", true);
        linkNodes(nodeMap, "EntryExitNode", "CorridorGCenter", true);
        linkNodes(nodeMap, "CorridorGLeft", "CorridorGCenter", true);
        linkNodes(nodeMap, "CorridorGCenter", "CorridorGRight", true);

        // First Floor Connections
        linkNodes(nodeMap, "Classroom101Node", "Corridor1Left", true);
        linkNodes(nodeMap, "Classroom102Node", "Corridor1Center", true);
        linkNodes(nodeMap, "Lab1Node", "Corridor1Right", true);
        linkNodes(nodeMap, "Lab2Node", "Corridor1Left", true);
        linkNodes(nodeMap, "FacultyRoomNode", "Corridor1Right", true);
        linkNodes(nodeMap, "Stairs1Node", "Corridor1Left", true);
        linkNodes(nodeMap, "Lift1Node", "Corridor1Right", true);
        linkNodes(nodeMap, "Corridor1Left", "Corridor1Center", true);
        linkNodes(nodeMap, "Corridor1Center", "Corridor1Right", true);

        // Second Floor Connections
        linkNodes(nodeMap, "LibraryNode", "Corridor2Left", true);
        linkNodes(nodeMap, "SeminarHallNode", "Corridor2Right", true);
        linkNodes(nodeMap, "ServerRoomNode", "Corridor2Left", true);
        linkNodes(nodeMap, "ResearchLabNode", "Corridor2Right", true);
        linkNodes(nodeMap, "Stairs2Node", "Corridor2Left", true);
        linkNodes(nodeMap, "Lift2Node", "Corridor2Right", true);
        linkNodes(nodeMap, "Corridor2Left", "Corridor2Center", true);
        linkNodes(nodeMap, "Corridor2Center", "Corridor2Right", true);

        // Inter-floor Connections
        // Stairs are not wheelchair-accessible
        linkNodes(nodeMap, "StairsGNode", "Stairs1Node", false);
        linkNodes(nodeMap, "Stairs1Node", "Stairs2Node", false);
        // Lifts are wheelchair-accessible
        linkNodes(nodeMap, "LiftGNode", "Lift1Node", true);
        linkNodes(nodeMap, "Lift1Node", "Lift2Node", true);

        log.info("Seeded edges connection graph.");
        log.info("Database seeding completed successfully!");
    }

    private void registerNode(Map<String, Node> map, String key, int x, int y, Floor floor, Room room) {
        Node node = new Node();
        node.setXCoordinate(x);
        node.setYCoordinate(y);
        node.setFloor(floor);
        node.setRoom(room);
        node = nodeRepository.save(node);
        map.put(key, node);
    }

    private void linkNodes(Map<String, Node> nodeMap, String srcKey, String destKey, boolean isAccessible) {
        Node srcNode = nodeMap.get(srcKey);
        Node destNode = nodeMap.get(destKey);

        if (srcNode == null || destNode == null) {
            log.error("Could not find nodes for edge connection: {} <-> {}", srcKey, destKey);
            return;
        }

        Edge edge = new Edge();
        edge.setSourceNode(srcNode);
        edge.setDestinationNode(destNode);
        edge.setIsAccessible(isAccessible);
        edge.setIsBidirectional(true);

        // Calculate Euclidean distance weight
        double dx = srcNode.getXCoordinate() - destNode.getXCoordinate();
        double dy = srcNode.getYCoordinate() - destNode.getYCoordinate();
        double dz = 0.0;
        
        // Add vertical traversal cost if connecting different floors (e.g. lift, stairs)
        if (!srcNode.getFloor().getId().equals(destNode.getFloor().getId())) {
            dz = 150.0 * Math.abs(srcNode.getFloor().getFloorNumber() - destNode.getFloor().getFloorNumber());
        }
        
        edge.setDistance(Math.sqrt(dx * dx + dy * dy + dz * dz));
        edgeRepository.save(edge);
    }
}

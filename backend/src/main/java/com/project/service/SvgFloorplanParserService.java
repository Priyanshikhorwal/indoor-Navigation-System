package com.project.service;

import com.project.entity.Floor;
import com.project.entity.Location;
import com.project.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
public class SvgFloorplanParserService {

    private final LocationRepository locationRepository;

    public void parseSvgAndGenerateGraph(Path svgFilePath, Floor floor) {
        try {
            File svgFile = svgFilePath.toFile();
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(svgFile);
            doc.getDocumentElement().normalize();

            // Detect Rectangles (Rooms)
            NodeList rectList = doc.getElementsByTagName("rect");
            for (int i = 0; i < rectList.getLength(); i++) {
                Element rect = (Element) rectList.item(i);
                
                String xStr = rect.getAttribute("x");
                String yStr = rect.getAttribute("y");
                String widthStr = rect.getAttribute("width");
                String heightStr = rect.getAttribute("height");
                String id = rect.getAttribute("id");
                
                if (xStr.isEmpty() || yStr.isEmpty()) continue;

                int x = parseDimension(xStr);
                int y = parseDimension(yStr);
                int width = widthStr.isEmpty() ? 50 : parseDimension(widthStr);
                int height = heightStr.isEmpty() ? 50 : parseDimension(heightStr);
                
                String roomName = (id.isEmpty()) ? "Room " + (i + 1) : id;
                
                // Calculate center coordinate
                int centerX = x + (width / 2);
                int centerY = y + (height / 2);

                Location loc = new Location();
                loc.setName(roomName + " (Auto-" + System.currentTimeMillis() + ")");
                loc.setDescription("Auto-generated room from SVG");
                loc.setXCoordinate(centerX);
                loc.setYCoordinate(centerY);
                loc.setWidth(width);
                loc.setHeight(height);
                loc.setFloor(floor);
                loc.setType("ROOM");
                loc.setIsRestricted(false);
                
                locationRepository.save(loc);
            }
            
            // In a complete implementation, we'd also detect <path> elements as Corridors
            // and automatically generate PathConnections based on proximity/overlap.
            
        } catch (Exception e) {
            System.err.println("Failed to parse SVG Floorplan: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private int parseDimension(String value) {
        try {
            // Handle values like "100px", "100.5", etc.
            return (int) Double.parseDouble(value.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

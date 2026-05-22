package com.project.service;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.kabeja.dxf.DXFDocument;
import org.kabeja.parser.DXFParser;
import org.kabeja.parser.DXFParserException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Service that parses CAD/DXF files using Kabeja, extracts coordinates, room boundaries,
 * and creates Location and PathConnection entities.
 */
@Service
@RequiredArgsConstructor
public class DxfParserService {

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;

    /**
     * Parses the given DXF file and persists extracted graph data.
     *
     * @param file DXF file uploaded by admin
     * @throws IOException if the file cannot be read
     * @throws DXFParserException if parsing fails
     */
    public void parseAndPersist(MultipartFile file) throws IOException, DXFParserException {
        try (InputStream is = file.getInputStream()) {
            DXFParser parser = new DXFParser();
            DXFDocument document = parser.parse(is);
            // Simplified extraction: treat each POLYLINE as a room shape.
            // In a real implementation we'd analyze layers, attributes, etc.
            document.getDXFLayerList().forEach(layer -> {
                layer.getDXFEntities().forEach(entity -> {
                    // Example: handle LWPOLYLINE as room boundary
                    if (entity.getDXFEntityType().equals("LWPOLYLINE")) {
                        // Extract centroid as location coordinate (very naive).
                        double[] centroid = calculateCentroid(entity);
                        Location loc = new Location();
                        loc.setName(layer.getName() + "_room");
                        loc.setXCoordinate((int) Math.round(centroid[0]));
                        loc.setYCoordinate((int) Math.round(centroid[1]));
                        // Assume floor is provided via layer name convention "FLOOR_{id}".
                        // Extract floor id from layer name if present.
                        Integer floorId = extractFloorId(layer.getName());
                        // For simplicity set a dummy floor reference later by service.
                        // Persist location – floor will be set by another service after parsing.
                        locationRepository.save(loc);
                        // Connections will be generated later based on proximity.
                    }
                });
            });
        }
    }

    /**
     * Very naive centroid calculation for polyline entity.
     */
    private double[] calculateCentroid(org.kabeja.entities.DXFLWPolyline polyline) {
        double sumX = 0, sumY = 0;
        int count = polyline.getVertexCount();
        for (int i = 0; i < count; i++) {
            sumX += polyline.getVertex(i).getX();
            sumY += polyline.getVertex(i).getY();
        }
        return new double[]{sumX / count, sumY / count};
    }

    /**
     * Extract floor id from layer name using pattern FLOOR_{id}.
     */
    private Integer extractFloorId(String layerName) {
        try {
            if (layerName.startsWith("FLOOR_")) {
                return Integer.parseInt(layerName.substring(7));
            }
        } catch (NumberFormatException ignored) {}
        return 0; // default floor 0 if not found
    }
}

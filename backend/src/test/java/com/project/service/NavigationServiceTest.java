package com.project.service;

import com.project.entity.Building;
import com.project.entity.Floor;
import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NavigationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private PathConnectionRepository pathConnectionRepository;

    @InjectMocks
    private NavigationService navigationService;

    private Location loc1;
    private Location loc2;
    private Location loc3;
    private Location loc4;

    @BeforeEach
    public void setUp() {
        Building building = new Building(1L, "Main Building", "Description");
        Floor floor1 = new Floor(1L, building, 1, "Floor 1", null);
        Floor floor2 = new Floor(2L, building, 2, "Floor 2", null);

        // ID, Name, Description, X, Y, Floor
        loc1 = new Location(1L, "Room A", "Source room on floor 1", 10, 10, floor1);
        loc2 = new Location(2L, "Room B", "Intermediate room on floor 1", 20, 10, floor1);
        loc3 = new Location(3L, "Room C", "Intermediate room on floor 2", 20, 20, floor2);
        loc4 = new Location(4L, "Room D", "Destination on floor 2", 30, 20, floor2);
    }

    @Test
    public void testFindShortestPath_Success() {
        // Define path connections
        // Connection 1: Room A to Room B (distance = 10, accessible = true)
        PathConnection conn1 = new PathConnection(1L, loc1, loc2, 10.0, true, true, "BOTH");
        // Connection 2: Room B to Room C (distance = 15, accessible = true)
        PathConnection conn2 = new PathConnection(2L, loc2, loc3, 15.0, true, true, "BOTH");
        // Connection 3: Room C to Room D (distance = 10, accessible = true)
        PathConnection conn3 = new PathConnection(3L, loc3, loc4, 10.0, true, true, "BOTH");

        when(locationRepository.findById(1L)).thenReturn(Optional.of(loc1));
        when(locationRepository.findById(4L)).thenReturn(Optional.of(loc4));
        when(pathConnectionRepository.findAll()).thenReturn(Arrays.asList(conn1, conn2, conn3));

        List<Location> path = navigationService.findShortestPathAStar(1L, 4L, false);

        assertNotNull(path);
        assertEquals(4, path.size());
        assertEquals(loc1, path.get(0));
        assertEquals(loc2, path.get(1));
        assertEquals(loc3, path.get(2));
        assertEquals(loc4, path.get(3));
    }

    @Test
    public void testFindShortestPath_WheelchairAccessSkipsInaccessible() {
        // Connection 1: Room A to Room B (distance = 10, accessible = true)
        PathConnection conn1 = new PathConnection(1L, loc1, loc2, 10.0, true, true, "BOTH");
        // Connection 2: Room B to Room C (distance = 15, accessible = false - no ramp/elevator)
        PathConnection conn2 = new PathConnection(2L, loc2, loc3, 15.0, false, true, "BOTH");
        // Connection 3: Room C to Room D (distance = 10, accessible = true)
        PathConnection conn3 = new PathConnection(3L, loc3, loc4, 10.0, true, true, "BOTH");

        when(locationRepository.findById(1L)).thenReturn(Optional.of(loc1));
        when(locationRepository.findById(4L)).thenReturn(Optional.of(loc4));
        when(pathConnectionRepository.findAll()).thenReturn(Arrays.asList(conn1, conn2, conn3));

        // When wheelchairAccessible is true, we should fail to find a path because Room B to Room C is not accessible
        List<Location> path = navigationService.findShortestPathAStar(1L, 4L, true);

        assertNotNull(path);
        assertTrue(path.isEmpty());
    }
}

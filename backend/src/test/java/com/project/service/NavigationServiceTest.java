package com.project.service;

import com.project.entity.Building;
import com.project.entity.Floor;
import com.project.entity.Room;
import com.project.entity.Node;
import com.project.entity.Edge;
import com.project.repository.NodeRepository;
import com.project.repository.EdgeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NavigationServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private EdgeRepository edgeRepository;

    @InjectMocks
    private NavigationService navigationService;

    private Node node1;
    private Node node2;
    private Node node3;
    private Node node4;

    @BeforeEach
    public void setUp() {
        Building building = new Building(1L, "Smart Campus Block", "Description", null, null, null);
        Floor floor1 = new Floor(1L, building, 1, "Floor 1", null);
        Floor floor2 = new Floor(2L, building, 2, "Floor 2", null);

        Room roomA = new Room(1L, "Room A", "Desc", "ROOM", floor1);
        Room roomB = new Room(2L, "Room B", "Desc", "ROOM", floor1);
        Room roomC = new Room(3L, "Room C", "Desc", "ROOM", floor2);
        Room roomD = new Room(4L, "Room D", "Desc", "ROOM", floor2);

        node1 = new Node(1L, 10, 10, floor1, roomA);
        node2 = new Node(2L, 20, 10, floor1, roomB);
        node3 = new Node(3L, 20, 20, floor2, roomC);
        node4 = new Node(4L, 30, 20, floor2, roomD);
    }

    @Test
    public void testFindShortestPath_Success() {
        Edge edge1 = new Edge(1L, node1, node2, 10.0, true, true);
        Edge edge2 = new Edge(2L, node2, node3, 15.0, true, true);
        Edge edge3 = new Edge(3L, node3, node4, 10.0, true, true);

        when(edgeRepository.findAll()).thenReturn(Arrays.asList(edge1, edge2, edge3));

        List<Node> path = navigationService.findShortestPathAStar(node1, node4, false);

        assertNotNull(path);
        assertEquals(4, path.size());
        assertEquals(node1, path.get(0));
        assertEquals(node2, path.get(1));
        assertEquals(node3, path.get(2));
        assertEquals(node4, path.get(3));
    }

    @Test
    public void testFindShortestPath_WheelchairAccessSkipsInaccessible() {
        Edge edge1 = new Edge(1L, node1, node2, 10.0, true, true);
        Edge edge2 = new Edge(2L, node2, node3, 15.0, false, true); // Not wheelchair accessible
        Edge edge3 = new Edge(3L, node3, node4, 10.0, true, true);

        when(edgeRepository.findAll()).thenReturn(Arrays.asList(edge1, edge2, edge3));

        List<Node> path = navigationService.findShortestPathAStar(node1, node4, true);

        assertNotNull(path);
        assertTrue(path.isEmpty());
    }
}

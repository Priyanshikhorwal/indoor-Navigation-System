package com.project.repository;

import com.project.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {
    List<Node> findByFloorId(Long floorId);
    Optional<Node> findByRoomId(Long roomId);
    Optional<Node> findByRoomName(String roomName);
}

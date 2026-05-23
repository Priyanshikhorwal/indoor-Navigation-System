package com.project.repository;

import com.project.entity.Edge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EdgeRepository extends JpaRepository<Edge, Long> {
    List<Edge> findBySourceNodeFloorIdOrDestinationNodeFloorId(Long sourceFloorId, Long destinationFloorId);
}

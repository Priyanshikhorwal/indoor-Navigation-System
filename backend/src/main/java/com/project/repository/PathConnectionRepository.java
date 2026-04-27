package com.project.repository;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PathConnectionRepository extends JpaRepository<PathConnection, Long> {
    List<PathConnection> findBySourceLocationOrDestinationLocation(Location source, Location destination);
}

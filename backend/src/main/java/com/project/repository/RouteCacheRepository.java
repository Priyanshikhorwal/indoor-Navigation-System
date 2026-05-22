package com.project.repository;

import com.project.entity.RouteCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RouteCacheRepository extends JpaRepository<RouteCache, Long> {
    Optional<RouteCache> findBySourceIdAndDestinationId(Long sourceId, Long destinationId);
    void deleteBySourceIdAndDestinationId(Long sourceId, Long destinationId);
}

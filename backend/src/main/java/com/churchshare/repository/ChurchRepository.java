package com.churchshare.repository;

import com.churchshare.entity.Church;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    Optional<Church> findBySlug(String slug);
}

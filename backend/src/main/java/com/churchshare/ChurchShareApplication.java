package com.churchshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * ChurchShare Backend Application
 *
 * Zero-download PDF sharing platform for church congregations.
 */
@SpringBootApplication
@EnableSpringDataWebSupport
public class ChurchShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChurchShareApplication.class, args);
    }
}

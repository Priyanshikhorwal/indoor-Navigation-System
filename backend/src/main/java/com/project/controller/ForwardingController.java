package com.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardingController {

    // Forward UI routes to index.html so React Router can handle them
    @RequestMapping(value = {
            "/",
            "/navigate",
            "/login",
            "/register",
            "/admin-login",
            "/admin-register",
            "/user-dashboard",
            "/admin-dashboard"
    })
    public String forward() {
        return "forward:/index.html";
    }
}

package com.project.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendNavigationEmail(String toEmail, String navigationLink) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("Your Smart Indoor Navigation Link");

        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + navigationLink;

        String htmlContent = "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body { font-family: 'Inter', sans-serif; background-color: #f4f4f9; padding: 20px; text-align: center; }" +
                ".container { background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 500px; margin: auto; }" +
                "h1 { color: #1e293b; }" +
                "p { color: #475569; line-height: 1.6; }" +
                ".btn { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }" +
                ".qr-code { margin-top: 30px; border: 2px solid #e2e8f0; border-radius: 8px; padding: 10px; }" +
                "</style></head><body>" +
                "<div class='container'>" +
                "<h1>Indoor Navigation System</h1>" +
                "<p>Your personalized indoor navigation route is ready! Click the button below to start your step-by-step guidance. This link is valid for 24 hours.</p>" +
                "<a href='" + navigationLink + "' class='btn'>Start Navigation</a>" +
                "<p style='margin-top: 30px;'>Or scan this QR code with your mobile device:</p>" +
                "<img src='" + qrCodeUrl + "' class='qr-code' alt='QR Code' />" +
                "</div></body></html>";

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}

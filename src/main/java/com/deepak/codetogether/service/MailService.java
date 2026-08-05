package com.deepak.codetogether.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class MailService {

    @Autowired(required = false)
    private JavaMailSender javaMailSender;

    @Value("${mail.provider:smtp}")
    private String mailProvider;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.from:}")
    private String brevoFrom;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from:}")
    private String resendFrom;

    public void sendEmail(String to, String subject, String text) {
        sendHtmlEmail(to, subject, buildGenericEmailTemplate(subject, text));
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        String provider = normalizeProvider(mailProvider);
        System.out.println("[MAIL CONFIG] provider=" + provider + " | smtpUserConfigured=" + hasText(fromEmail));

        if ("brevo".equals(provider)) {
            if (hasText(brevoApiKey)) {
                boolean sent = sendViaBrevoApi(to, subject, htmlContent);
                if (sent) return;
            }
            throw new RuntimeException("Brevo provider selected but BREVO_API_KEY is missing or invalid");
        }

        if ("resend".equals(provider)) {
            if (hasText(resendApiKey)) {
                boolean sent = sendViaResendApi(to, subject, htmlContent);
                if (sent) return;
            }
            throw new RuntimeException("Resend provider selected but RESEND_API_KEY is missing or invalid");
        }

        if (hasText(brevoApiKey)) {
            boolean sent = sendViaBrevoApi(to, subject, htmlContent);
            if (sent) return;
        }

        if (hasText(resendApiKey)) {
            boolean sent = sendViaResendApi(to, subject, htmlContent);
            if (sent) return;
        }

        try {
            if (javaMailSender != null) {
                MimeMessage message = javaMailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                String sender = hasText(fromEmail) ? fromEmail : "noreply@codetogether.com";
                helper.setFrom(sender);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                javaMailSender.send(message);
                System.out.println("[MAIL HTML] Successfully sent HTML email via SMTP to " + to);
                return;
            }
        } catch (Exception ex) {
            System.err.println("[MAIL SMTP ERROR] " + ex.getMessage());
        }
        throw new RuntimeException("Failed to send email. Set MAIL_PROVIDER=brevo or resend, or configure SMTP credentials in Render environment variables.");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeProvider(String provider) {
        if (provider == null) return "smtp";
        String normalized = provider.trim().toLowerCase();
        if (normalized.equals("brevo") || normalized.equals("resend")) {
            return normalized;
        }
        return "smtp";
    }

    private boolean sendViaBrevoApi(String to, String subject, String htmlContent) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String senderEmail = hasText(brevoFrom) ? brevoFrom : "letscodetogetheredu@gmail.com";

            java.util.Map<String, Object> payload = java.util.Map.of(
                "sender", java.util.Map.of("name", "Let's Code Together", "email", senderEmail),
                "to", java.util.List.of(java.util.Map.of("email", to)),
                "subject", subject,
                "htmlContent", htmlContent
            );

            String jsonBody = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[MAIL BREVO API SUCCESS] Email sent to " + to + " | Response: " + response.body());
                return true;
            } else {
                System.err.println("[MAIL BREVO API ERROR] Status " + response.statusCode() + " | Body: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("[MAIL BREVO API EXCEPTION] " + e.getMessage());
        }
        return false;
    }

    private boolean sendViaResendApi(String to, String subject, String htmlContent) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String senderEmail = hasText(resendFrom) ? resendFrom : fromEmail;
            if (!hasText(senderEmail)) {
                System.err.println("[MAIL RESEND API ERROR] RESEND_FROM or EMAIL_USER is required to send messages through Resend");
                return false;
            }

            String jsonBody = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                senderEmail, to, escapeJson(subject), escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "ResendJava/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[MAIL RESEND API SUCCESS] Email sent to " + to + " | Response: " + response.body());
                return true;
            } else {
                System.err.println("[MAIL RESEND API ERROR] Status " + response.statusCode() + " | Body: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("[MAIL RESEND API EXCEPTION] " + e.getMessage());
        }
        return false;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    public void sendRegistrationOtp(String to, String otp) {
        String subject = "⚡ Verify Your Account — Let's Code Together";
        String html = buildOtpEmailTemplate(
            "Welcome to Let's Code Together! 🚀",
            "Thank you for joining our developer community. Please enter the verification code below to verify your email address and activate your account.",
            otp,
            "Registration OTP Code",
            "#22c55e"
        );
        sendHtmlEmail(to, subject, html);
    }

    public void sendPasswordResetOtp(String to, String otp) {
        String subject = "🔑 Reset Your Password — Let's Code Together";
        String html = buildOtpEmailTemplate(
            "Password Reset Request 🔐",
            "We received a request to reset the password for your account. Enter the verification code below to verify your request and set a new password.",
            otp,
            "Password Reset OTP Code",
            "#38bdf8"
        );
        sendHtmlEmail(to, subject, html);
    }

    private String buildOtpEmailTemplate(String title, String description, String otp, String badgeLabel, String accentColor) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; background-color:#060b18; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#f0f6ff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#060b18; padding: 40px 10px;">
                <tr>
                  <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#0d1626; border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                      
                      <!-- HEADER -->
                      <tr>
                        <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, transparent 100%);">
                          <div style="font-size:24px; font-weight:800; color:""" + accentColor + """
                            ; letter-spacing:0.5px;">⚡ Let's Code Together</div>
                          <div style="font-size:11px; color:#7a8fa8; text-transform:uppercase; letter-spacing:2px; margin-top:4px;">Official Verification Service</div>
                        </td>
                      </tr>

                      <!-- BODY -->
                      <tr>
                        <td style="padding: 36px 40px;">
                          <h2 style="font-size:22px; font-weight:700; color:#ffffff; margin:0 0 12px; letter-spacing:-0.3px;">""" + title + """
                          </h2>
                          <p style="font-size:14px; line-height:1.6; color:#a0aec0; margin:0 0 24px;">""" + description + """
                          </p>

                          <!-- OTP BOX -->
                          <div style="background-color:#111c2e; border:1px solid """ + accentColor + """
                            ; border-radius:12px; padding:28px; text-align:center; margin:28px 0;">
                            <div style="font-size:11px; font-weight:600; color:#7a8fa8; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">""" + badgeLabel + """
                            </div>
                            <div style="font-family:'Courier New', Courier, monospace; font-size:42px; font-weight:800; letter-spacing:12px; color:""" + accentColor + """
                            ;">""" + otp + """
                            </div>
                            <div style="font-size:11px; color:#64748b; margin-top:12px;">Valid for 5 minutes • Do not share</div>
                          </div>

                          <div style="background:rgba(245,158,11,0.08); border-left:3px solid #f59e0b; padding:14px 16px; border-radius:6px; margin-top:24px;">
                            <p style="font-size:12px; color:#f59e0b; margin:0; line-height:1.5;">
                              <strong>🔒 Security Notice:</strong> If you did not request this email, please ignore it or secure your account. Our team will never ask for your OTP.
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- FOOTER -->
                      <tr>
                        <td align="center" style="padding: 24px 40px; background-color:#080e1a; border-top:1px solid rgba(255,255,255,0.05); font-size:12px; color:#64748b;">
                          <p style="margin:0 0 6px;">Sent by <strong>Let's Code Together</strong> Security Service</p>
                          <p style="margin:0; font-size:11px; color:#475569;">© 2026 Let's Code Together. All rights reserved.</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    private String buildGenericEmailTemplate(String title, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            </head>
            <body style="margin:0; padding:0; background-color:#060b18; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#f0f6ff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#060b18; padding: 40px 10px;">
                <tr>
                  <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#0d1626; border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden;">
                      <tr>
                        <td align="center" style="padding: 28px 40px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, transparent 100%);">
                          <div style="font-size:22px; font-weight:800; color:#22c55e;">⚡ Let's Code Together</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 32px 40px;">
                          <h2 style="font-size:20px; font-weight:700; color:#ffffff; margin:0 0 16px;">""" + title + """
                          </h2>
                          <div style="font-size:14px; line-height:1.7; color:#a0aec0; white-space: pre-wrap;">""" + bodyContent + """
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 20px 40px; background-color:#080e1a; font-size:11px; color:#475569;">
                          © 2026 Let's Code Together. All rights reserved.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}


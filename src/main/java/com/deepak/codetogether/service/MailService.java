package com.deepak.codetogether.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class MailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String text) {
        sendHtmlEmail(to, subject, buildGenericEmailTemplate(subject, text));
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@codetogether.com";
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            javaMailSender.send(message);
            System.out.println("[MAIL HTML] Successfully sent HTML email to " + to + " | Subject: " + subject);
        } catch (MessagingException | MailException ex) {
            System.err.println("[MAIL ERROR] Failed to send HTML email to " + to + ": " + ex.getMessage());
            throw new RuntimeException("Failed to send email", ex);
        }
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


const nodemailer = require("nodemailer");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");

class EmailServices {
    constructor() {
        this.to = null;
        this.subject = "";
        this.template = null;
        this.context = null;

        // Initialize SMTP transporter
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
        });
    }

    /** Setters */
    setTo(to) {
        if (!to) throw new Error("Recipient email (to) is required");
        this.to = to;
    }

    setSubject(subject) {
        if (!subject) throw new Error("Email subject is required");
        this.subject = subject;
    }

    setTemplate(template) {
        if (!template) throw new Error("Email template name is required");
        this.template = template;
    }

    setData(context) {
        if (!context) throw new Error("Template data (context) is required");
        this.context = context;
    }

    /** Render EJS Template */
    async renderTemplate() {
        const templatePath = path.join(process.cwd(), "views/email-templates", `${this.template}.ejs`);
        console.log(templatePath)
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file '${this.template}.ejs' not found`);
        }

        return await ejs.renderFile(templatePath, this.context);
    }

    /** Send Email */
    async sendEmail() {
        try {
            if (!this.to || !this.subject || !this.template || !this.context) {
                throw new Error("Missing required email parameters (to, subject, template, context)");
            }
            const htmlContent = await this.renderTemplate();
            const mailOptions = {
                from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`, // Sender address,
                to: this.to,
                subject: this.subject,
                html: htmlContent, // Rendered HTML content from EJS
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${this.to}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`❌ Error sending email to ${this.to}:`, error.message);
            throw error;
        }
    }
}

module.exports = EmailServices;

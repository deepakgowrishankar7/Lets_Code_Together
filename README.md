<div align="center">

# 🚀 Let's Code Together

### _An All-in-One Interactive Coding, Learning & Community Platform_

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

**Learn · Code · Compile · Visualize · Communicate — All in One Place**

_A premium, full-stack web platform where students can learn programming through structured courses, compile code in 8+ languages, visualize execution step-by-step, take quizzes, and chat with peers — all wrapped in a glassmorphic, modern UI._

<br/>

[🌐 Live Demo](https://lets-code-together.onrender.com) · [🐛 Report Bug](https://github.com/deepakgowrishankar7/Lets_Code_Together/issues) · [✨ Request Feature](https://github.com/deepakgowrishankar7/Lets_Code_Together/issues)

</div>

---

## 📸 Preview

<div align="center">

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Light Mode](https://img.shields.io/badge/🌞-Light%20Mode-f8fafc?style=for-the-badge) | ![Dark Mode](https://img.shields.io/badge/🌙-Dark%20Mode-0f172a?style=for-the-badge) |

</div>

> **💡 Tip:** The app launches in **Light Mode** by default and supports a seamless theme toggle between Light and Dark modes across all pages.

---

## ✨ Features at a Glance

<table>
<tr>
<td width="50%">

### 🎓 Learning Hub
- **4 Active Courses** — Java, Python, SQL, Data Structures & Algorithms
- **12+ Upcoming Courses** — C++, C, HTML/CSS, Web Dev, React, AWS, DBMS, Data Analytics, Node.js, Figma, Cybersecurity, Photoshop, Design Thinking
- **Structured Curriculum** — Topic-by-topic learning with PDF resources
- **Animated Video Lessons** — Visual concept explanations
- **Interactive Quizzes** — Test knowledge with scored assessments

</td>
<td width="50%">

### 💻 IDE Workbench
- **Multi-Language Online Compiler** — Python 3, Java 21, C++ (GCC), C (GCC), JavaScript (Node.js), Go, Ruby, PHP
- **Code Execution Visualizer** — Line-by-line execution with Python Tutor integration
- **Live Code Rooms** — Real-time collaborative coding sessions
- **Keyboard Shortcuts** — `Ctrl+Enter` to run code
- **Execution Stats** — Runtime, memory, and status tracking

</td>
</tr>
<tr>
<td width="50%">

### 💬 Communication Hub
- **Public Chat** — Community-wide discussions
- **Private Messaging** — Direct messaging between users
- **Admin Announcements** — Broadcast messages from admins
- **Real-Time Search** — Multi-field user search (name/handle)
- **Date-Grouped Messages** — Today, Yesterday, and date headers

</td>
<td width="50%">

### 🛡️ Platform Features
- **JWT Authentication** — Secure login with token-based auth
- **Admin Dashboard** — User management, analytics, notifications
- **Quiz Score Tracking** — Performance analytics with charts
- **Email Integration** — Password reset via email
- **PWA Support** — Installable as a native-like app
- **Dark/Light Theme** — System-wide theme toggle

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

<div align="center">

### Backend
| Technology | Purpose |
|:---|:---|
| **Spring Boot 3.5** | Core framework & REST API |
| **Spring Security** | Authentication & authorization |
| **Spring Data JPA** | Database ORM & repository layer |
| **Spring Mail** | Email services (password reset) |
| **JWT (jjwt 0.12.5)** | Token-based authentication |
| **MySQL** | Relational database |
| **Lombok** | Boilerplate reduction |
| **SpringDoc OpenAPI** | API documentation (Swagger UI) |

### Frontend
| Technology | Purpose |
|:---|:---|
| **Vanilla HTML/CSS/JS** | Core UI — no framework overhead |
| **Glassmorphic Design System** | Premium UI with `backdrop-filter: blur` |
| **Chart.js** | Quiz score analytics & visualizations |
| **Google Fonts (Inter)** | Modern typography |
| **Service Worker** | PWA offline support |

### DevOps & Deployment
| Technology | Purpose |
|:---|:---|
| **Docker** | Multi-stage build with compiler runtimes |
| **Render** | Cloud hosting with auto-deploy from GitHub |
| **Maven** | Build automation |

</div>

---

## 📁 Project Structure

```
Lets_Code_Together/
├── 📂 src/main/java/com/deepak/codetogether/
│   ├── 📂 config/           # Security config, CORS, app configuration
│   ├── 📂 controller/       # REST API controllers
│   │   ├── AuthController          # Login, register, password reset
│   │   ├── CompileController       # Multi-language code compilation
│   │   ├── MessageController       # Public, private & admin messaging
│   │   ├── QuizController          # Quiz submission & score tracking
│   │   ├── NotificationController  # Admin notifications & dismissals
│   │   ├── RoomController          # Live collaborative code rooms
│   │   ├── JavaConceptController   # Java concept content API
│   │   └── SseController           # Server-Sent Events for real-time
│   ├── 📂 dto/              # Data Transfer Objects
│   ├── 📂 entity/           # JPA entities
│   │   ├── User                    # User accounts
│   │   ├── PublicMessage           # Public chat messages
│   │   ├── PrivateMessage          # Direct messages
│   │   ├── AdminMessage            # Admin broadcast messages
│   │   ├── QuizScore               # Quiz attempt records
│   │   ├── Notification            # Platform notifications
│   │   └── JavaConcept             # Java learning content
│   ├── 📂 repository/       # Spring Data JPA repositories
│   ├── 📂 security/         # JWT service & token management
│   └── 📂 service/          # Business logic layer
│
├── 📂 src/main/resources/
│   ├── 📄 application.properties   # App config (DB, mail, JWT)
│   └── 📂 static/                  # Frontend assets
│       ├── 📄 index.html           # Landing page & login/register
│       ├── 📄 main.html            # Main dashboard (SPA)
│       ├── 📄 admin.html           # Admin panel
│       ├── 📄 about.html           # About page
│       ├── 📄 help.html            # Help & FAQ page
│       ├── 📄 styles.css           # Core design system (~9500 lines)
│       ├── 📄 scripts.js           # Core application logic
│       ├── 📄 dsa-course.js        # DSA course content & modules
│       ├── 📄 quizzes.js           # Quiz question banks
│       ├── 📄 manifest.json        # PWA manifest
│       ├── 📄 sw.js                # Service worker
│       └── 📂 pdfs/                # Course PDF resources
│
├── 📄 Dockerfile                   # Multi-stage Docker build
├── 📄 pom.xml                      # Maven dependencies
└── 📄 README.md                    # You are here!
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:---|:---|
| **Java JDK** | 21+ |
| **Maven** | 3.9+ (or use included `mvnw` wrapper) |
| **MySQL** | 8.0+ |
| **Node.js** _(optional, for JS compilation)_ | 18+ |

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/deepakgowrishankar7/Lets_Code_Together.git
cd Lets_Code_Together
```

### 2️⃣ Configure the Database

Create a MySQL database and update `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/codetogether
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### 3️⃣ Configure Email (Optional)

For password reset functionality, configure your email credentials:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

### 4️⃣ Run the Application

```bash
# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Or with Maven installed
mvn spring-boot:run
```

### 5️⃣ Open in Browser

```
http://localhost:8081
```

---

## 🐳 Docker Deployment

The Docker image includes compilers for **Java, Python, C, C++, and Node.js** for the online code compiler.

```bash
# Build the image
docker build -t codetogether .

# Run the container
docker run -p 8081:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/codetogether \
  -e SPRING_DATASOURCE_USERNAME=your_user \
  -e SPRING_DATASOURCE_PASSWORD=your_pass \
  codetogether
```

---

## ☁️ Render Deployment

This project is configured for **automatic deployment** on [Render](https://render.com):

1. Connect your GitHub repository to Render
2. Set the **Docker** build option
3. Configure environment variables for database and email
4. Push to `main` branch — Render auto-deploys! 🚀

---

## 📡 API Documentation

Once the app is running, access the interactive API docs at:

```
http://localhost:8081/swagger-ui.html
```

### Key API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate & receive JWT |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/compile/run` | Compile & execute code |
| `GET` | `/api/messages/public` | Fetch public chat messages |
| `POST` | `/api/messages/public` | Send a public message |
| `GET` | `/api/messages/private/{email}` | Fetch private conversation |
| `POST` | `/api/messages/private` | Send a private message |
| `GET` | `/api/quiz/scores` | Get quiz scores |
| `POST` | `/api/quiz/submit` | Submit quiz answers |
| `GET` | `/api/notifications` | Get platform notifications |

---

## 🎨 Design Philosophy

<table>
<tr>
<td>

**🪟 Glassmorphism**
<br/>Frosted glass cards with `backdrop-filter: blur` for depth and elegance

</td>
<td>

**🎯 Royal Blue Palette**
<br/>Consistent `#2563eb` accent across all interactive elements

</td>
<td>

**✨ Micro-Animations**
<br/>Smooth transitions, hover effects, and reveal animations throughout

</td>
</tr>
<tr>
<td>

**📱 Responsive**
<br/>Fully adaptive layout for desktop, tablet, and mobile devices

</td>
<td>

**🌗 Dual Theme**
<br/>Light and Dark modes with seamless toggling

</td>
<td>

**⚡ Performance**
<br/>Vanilla JS — zero framework overhead, instant load times

</td>
</tr>
</table>

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Deepak Gowrishankar**

[![GitHub](https://img.shields.io/badge/GitHub-deepakgowrishankar7-181717?style=for-the-badge&logo=github)](https://github.com/deepakgowrishankar7)

---

<sub>⭐ If you found this project useful, please consider giving it a star!</sub>

</div>

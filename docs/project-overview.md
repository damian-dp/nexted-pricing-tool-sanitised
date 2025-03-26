# Quote Tool Project Overview

The Quote Tool is a web-based application designed for third party agents to generate and manage quotes for prospective students. The system allows external agents to create quotes based on dynamic pricing variables such as region, visa status, course selection, and accommodation options. Admins and managers can configure pricing rules, discounts, and additional settings to tailor the quoting process.

The tool ensures that quotes are fixed at the time of creation, maintaining pricing integrity even if future updates occur.

<br>

## **Tech Stack**

#### **Client**

-   **React/Vite** - Fast and modern front-end framework for building UI components.
-   **TailwindCSS** - Utility-first CSS framework for styling.
-   **Shadcn/UI** - Component library for building UI components.

#### **Server**

-   **Supabase (Database Functions and Edge Functions)** - Serverless functions for business logic and API endpoints.

#### **Database**

-   **Supabase (PostgreSQL)** - A fully managed relational database for storing application data.

#### **Authentication**

-   **Clerk** - Authentication and user management solution for secure sign-in.

#### **File Storage**

-   **HubSpot (File Manager API)** - Used to store and manage files related to quotes and documentation.

#### **Email Service**

-   **HubSpot (Single Send API)** - Handles email notifications and quote sharing functionality.

#### **Version Control**

-   **GitHub** - Code repository for version control and collaboration.

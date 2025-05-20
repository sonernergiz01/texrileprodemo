# Architecture Documentation

## Overview

This project is a comprehensive Textile ERP (Enterprise Resource Planning) system designed to manage the entire textile manufacturing process from order creation to shipment. The application follows a client-server architecture with a React frontend and a Node.js/Express backend. It employs a PostgreSQL database for data persistence and includes features such as order management, production planning, quality control, dye recipes management, inventory tracking, and reporting.

## System Architecture

The system follows a modern web application architecture with clear separation between client and server components:

### Frontend Architecture

- **Technology Stack**: React with TypeScript
- **Component Library**: Leverages Radix UI components with a custom design system through Shadcn UI
- **State Management**: Uses React Query (Tanstack Query) for server state management
- **Styling**: Tailwind CSS for utility-first styling
- **Build Tools**: Vite for fast development and optimized production builds

### Backend Architecture

- **Technology Stack**: Node.js with Express and TypeScript
- **API Design**: RESTful API architecture
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with Passport.js
- **WebSockets**: Implemented for real-time notifications and updates

### Database 

- **Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM with schema definitions in TypeScript
- **Schema Design**: Modular schema approach with separate schema files for different system modules
- **Migrations**: Drizzle Kit for database schema migrations

## Key Components

### Client-Side Components

1. **Pages**: The application is organized into multiple pages corresponding to different departments and functions within the textile manufacturing process.

2. **UI Components**: Leverages a component library based on Radix UI primitives with a custom design system.

3. **Data Fetching Layer**: Uses React Query for efficient data fetching, caching, and state management.

4. **Routing**: Client-side routing for seamless navigation between different sections of the application.

### Server-Side Components

1. **API Routes**: Organized by functional domains (orders, planning, quality, etc.).

2. **Authentication Services**: Manages user authentication and permission-based access control.

3. **Storage Layer**: Abstracts database access through a structured service pattern.

4. **Notification System**: Real-time notifications for various events in the system.

5. **Device Integration**: Support for interfacing with measuring devices and barcode scanners through serial ports.

### Database Schema

The database schema is modular and comprehensive, covering all aspects of textile manufacturing:

1. **Core Entities**:
   - Users, roles, and permissions
   - Departments and organizational structure
   - Customers and customer interactions

2. **Manufacturing Entities**:
   - Orders and order tracking
   - Production plans and steps
   - Machine definitions and maintenance
   - Quality control measures and defect tracking

3. **Specialized Modules**:
   - Dye recipes and chemicals management
   - Fabric samples and kartela (swatch cards)
   - Yarn inventory and movement tracking
   - Weaving and finishing processes

## Data Flow

1. **Order Processing Flow**:
   - Customer orders are created in the sales module
   - Orders are converted to production plans
   - Production plans are broken down into production steps
   - Work is assigned to specific departments and machines
   - Quality checks are performed at multiple stages
   - Finished goods are prepared for shipment

2. **Real-time Updates**:
   - WebSocket connections provide real-time updates for production status
   - Notifications inform relevant stakeholders about important events
   - Machine operators receive work assignments and record progress

3. **Quality Assurance Flow**:
   - Quality checks are integrated at multiple stages of production
   - Defects are recorded and tracked
   - Measurement devices can be connected for automated data collection

## External Dependencies

1. **UI Components**:
   - Radix UI (@radix-ui/*): Accessible component primitives
   - Shadcn UI: Component styling and design system
   - Tailwind CSS: Utility-first CSS framework
   - FontAwesome: Icon system

2. **Data Management**:
   - Tanstack Query (@tanstack/react-query): Data fetching and state management
   - Tanstack Table (@tanstack/react-table): Advanced table functionality
   - Zod: Schema validation

3. **Hardware Integration**:
   - Serial Port (@serialport/*): Communication with physical devices
   - QR Code generation and scanning

4. **Database**:
   - Neon Serverless PostgreSQL: Database service
   - Drizzle ORM: Database access layer

## Deployment Strategy

The application is configured for deployment on Replit, with specific settings for development and production environments:

1. **Development Environment**:
   - Vite dev server with hot module replacement
   - Local PostgreSQL database

2. **Production Build**:
   - Vite for frontend build optimization
   - esbuild for server code bundling
   - Static assets served by Express

3. **Deployment Target**:
   - Configured for autoscaling on Replit
   - Ports configured for web access (5000 internal mapping to 80 external)

4. **Environment Configuration**:
   - Environment variables for database connection and other settings
   - Different NODE_ENV settings for development and production

## Security Considerations

1. **Authentication**: Session-based authentication with secure cookies

2. **Authorization**: Role-based access control with granular permissions

3. **Data Validation**: Input validation using Zod schemas

4. **Safe Database Access**: Parameterized queries through Drizzle ORM to prevent SQL injection

5. **Error Handling**: Structured error handling to prevent leaking sensitive information
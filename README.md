# Update Product Service

This is the microservice for Update Product in the +Kotas App.

## Group Members

- Christopher Pallo
- Brayan Dávila

## Table of Contents

1. [Microservice Description](#microservice-description)
2. [Installation](#installation)
   - [Requirements](#requirements)
   - [Clone the Repository](#clone-the-repository)
   - [Install Dependencies](#install-dependencies)
   - [Start the Server](#start-the-server)
   - [Evidence](#evidence)
3. [Usage](#usage)
   - [Verify Server Functionality](#verify-server-functionality)

## Microservice Description

The `update-product-service` microservice is responsible for managing the list of users in the +kotas App. Allows you to list products using an HTTP PUT request to the corresponding route.

## Installation

### Requirements

- Node.js
- npm (Node Package Manager)

### Clone the Repository

```sh
https://github.com/ChristopherPalloArias/gr8-update-product-service.git
cd update-product-service
```

### Install Dependencies
```sh
npm install
```

### Starting the Server
Before starting the application you must change the database credentials in the index.js file if you want to use the application locally and independently, this is because initially the application is configured to be used in conjunction with the rest of Microservices.
Repository: [https://github.com/ChristopherPalloArias/kotas-frontend](https://github.com/ChristopherPalloArias/kotas-frontend.git)

### Evidence
![image](https://github.com/user-attachments/assets/b8337272-3d7f-4bae-a5ed-7bf477eb710e)

## Usage
### Verify Server Functionality

Method: POST 
URL: `http://gr8-load-balancer-users-1651289822.us-east-2.elb.amazonaws.com:8090`  
Description: This route displays a message to verify that the server is running.
![image](https://github.com/user-attachments/assets/09bd4504-0a1e-44bb-9e46-617923645760)


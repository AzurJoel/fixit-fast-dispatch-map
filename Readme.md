# FixIt Fast Appliances Dispatch Map

## Project Overview

This is an interactive web mapping application designed to assist "FixIt Fast Appliances" in efficiently dispatching technicians to service requests. It provides a visual, real-time interface for dispatchers to manage field operations, visualize geographical data, and optimize routing.

## Problem Solved

Traditional dispatching methods can be inefficient, leading to delayed service, increased fuel costs, and suboptimal technician utilization. This application addresses these challenges by:
* Providing a clear visual overview of all active service requests and available technicians.
* Enabling quick identification of the closest or most suitable technician for a service request.
* Streamlining route planning to reduce dispatch time and improve overall service efficiency.

## Key Features

* **Interactive Map:** Built on the Leaflet.js library, offering smooth panning, zooming, and base map tiles from OpenStreetMap.
* **Dynamic Data Visualization:**
    * **Service Requests:** Displayed as colored circular markers indicating priority (High: Red, Medium: Yellow, Low: Cyan).
    * **Technicians:** Represented by distinct blue wrench icons.
* **Sidebar Navigation:**
    * Lists all pending service requests and available technicians.
    * Allows filtering service requests by priority (All, High, Medium, Low).
* **Intuitive Selection & Routing:**
    * Users can select a technician and a service request either by clicking on their respective markers on the map or by selecting items from the sidebar lists.
    * Once one technician and one service request are selected, a clear blue route line is dynamically generated on the map showing the optimal path between them.
* **Clear Route Functionality:** A dedicated button to clear the current route and reset selections for new assignments.
* **Data Integration:** Service request and technician data are loaded from a local `.csv` file, demonstrating efficient data parsing and integration.

## Technologies Used

* **HTML5:** Provides the foundational structure of the web application.
* **CSS3:** Styles the user interface, customizes map elements, and ensures responsive layout.
* **JavaScript (ES6+):** Powers all interactive elements, map logic, data processing, and dynamic content updates.
* **Leaflet.js:** An open-source JavaScript library for mobile-friendly interactive maps.
* **Leaflet Routing Machine:** A Leaflet plugin used for calculating and displaying routes between two geographical points.
* **Papa Parse:** A powerful and fast JavaScript library for parsing CSV (Comma Separated Values) files.
* **Font Awesome:** Used for custom icons (e.g., the technician wrench icon).

## How to Run Locally

To run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME].git
    ```
    (Replace `[YOUR_GITHUB_USERNAME]` and `[YOUR_REPO_NAME]` with your actual GitHub username and repository name.)
2.  **Navigate to the project directory:**
    ```bash
    cd [your-repo-name]
    ```
3.  **Install a Live Server extension (recommended for VS Code):** If you use VS Code, install the "Live Server" extension by Ritwick Dey from the marketplace.
4.  **Open with Live Server:** Right-click on `index.html` in your file explorer and select "Open with Live Server" (or click the "Go Live" button in the VS Code status bar).
5.  Your default web browser will open the application, typically at `http://127.0.0.1:5500/index.html`.

## Live Demo

Experience the interactive dispatch map live here:
[https://yourusername.github.io/your-repository-name/](https://yourusername.github.io/your-repository-name/)
**(Remember to replace `yourusername` and `your-repository-name` with your actual GitHub details once deployed)**

## GitHub Repository

Explore the source code on GitHub:
[https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME]](https://github.com/[YOUR_GITHUB_USERNAME]/[YOUR_REPO_NAME])
**(Remember to replace `[YOUR_GITHUB_USERNAME]` and `[YOUR_REPO_NAME]` with your actual GitHub username and repository name)**
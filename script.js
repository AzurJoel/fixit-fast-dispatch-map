// --- 1. Initialize the Map ---
// L.map('map') creates a Leaflet map object bound to the HTML div with id="map"
// .setView([latitude, longitude], zoom_level) sets the initial view of the map
const map = L.map('map').setView([0.3475, 32.5822], 12); // Centered on Kampala, zoom level 12

// Add OpenStreetMap tile layer (the base map)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// --- 2. Custom Icons & Layer Groups ---

// Custom icon for technicians (using Font Awesome wrench icon)
const technicianIcon = L.divIcon({
    className: 'technician-icon', // CSS class for styling
    html: '<i class="fas fa-wrench"></i>', // Font Awesome icon HTML
    iconSize: [28, 28], // Size of the icon
    iconAnchor: [14, 28], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -28] // Point from which the popup should open relative to the iconAnchor
});

// Function to get a custom icon for service requests based on priority
function getRequestIcon(priority) {
    let className = 'request-marker-low'; // Default class for Low priority
    if (priority === 'High') {
        className = 'request-marker-high'; // Class for High priority
    } else if (priority === 'Medium') {
        className = 'request-marker-medium'; // Class for Medium priority
    }
    return L.divIcon({
        className: className, // CSS class for styling
        html: '', // No text inside the marker, just color
        iconSize: [20, 20], // Size of the icon
        iconAnchor: [10, 10], // Centered anchor
        popupAnchor: [0, -10] // Point from which the popup should open
    });
}

// Leaflet Layer Groups to manage different types of markers (can be toggled later)
const serviceRequestLayer = L.layerGroup().addTo(map); // Add service requests to this layer
const technicianLayer = L.layerGroup().addTo(map);     // Add technicians to this layer
let routingControl = null; // Variable to hold the Leaflet Routing Machine instance

// --- 3. Global Variables for Data and Selection ---
let allServiceRequests = []; // Stores all parsed service request data
let allTechnicians = [];     // Stores all parsed technician data
let selectedTechnician = null; // Stores the currently selected technician object for routing
let selectedServiceRequest = null; // Stores the currently selected service request object for routing

// Get references to HTML elements
const requestListElement = document.getElementById('request-list');
const technicianListElement = document.getElementById('technician-list');
const priorityFilter = document.getElementById('priority-filter');
const pendingCountSpan = document.getElementById('pending-count');
const clearRouteButton = document.getElementById('clear-route');


// --- 4. Load Data (from CSV using Papa Parse) ---
async function loadData() {
    try {
        const response = await fetch('FixitFast_data.csv'); // Fetch the CSV file
        const csvText = await response.text(); // Get the response as plain text

        // Parse CSV using Papa Parse library
        Papa.parse(csvText, {
            header: true, // Treat the first row of CSV as headers
            dynamicTyping: true, // Automatically convert numbers, booleans, etc.
            skipEmptyLines: true, // Important to prevent errors from blank rows

            complete: function(results) {
                // Assuming the first 10 rows in your CSV represent technicians, and the rest are service requests.
                // In a real application, you'd likely have separate data sources or a clear 'type' column.
                const rawData = results.data;

                // Manually map first 10 rows to technician structure
                allTechnicians = rawData.slice(0, 10).map(row => ({
                    'Technician ID': row['Service Request ID'], // Re-using existing ID for example
                    'Technician Name': row['Customer Name'], // Re-using existing name for example
                    'Current Location (Lat)': row.Latitude,
                    'Current Location (Lon)': row.Longitude,
                    'Skills/Specialties': 'All Appliances', // Placeholder skill
                    'Availability Status': 'Available', // Placeholder status
                    'Vehicle ID': row['Service Request ID'] ? row['Service Request ID'].replace('SR', 'VCL') : 'N/A' // Placeholder
                }));

                // The rest of the rows are service requests
                allServiceRequests = rawData.slice(10).filter(row =>
                    row.Latitude !== null && row.Longitude !== null && row['Service Request ID'] !== null
                );

                console.log("Technicians loaded:", allTechnicians);
                console.log("Service Requests loaded:", allServiceRequests);

                // Once data is loaded, render everything on the map and sidebar
                renderMapMarkers();
                renderSidebarLists();
            },
            error: function(err) {
                console.error("Error parsing CSV:", err);
            }
        });

    } catch (error) {
        console.error('Error fetching CSV data:', error);
    }
}

// --- 5. Render Map Markers ---
function renderMapMarkers() {
    // Clear existing markers from layers before re-rendering
    serviceRequestLayer.clearLayers();
    technicianLayer.clearLayers();

    // Add service requests to the map
    allServiceRequests.forEach(request => {
        // Ensure valid coordinates exist
        if (request.Latitude && request.Longitude) {
            const marker = L.marker([request.Latitude, request.Longitude], {
                icon: getRequestIcon(request['Severity/Priority']) // Use custom icon based on priority
            }).addTo(serviceRequestLayer); // Add to the service request layer

            // Bind a popup to the marker with detailed information
            marker.bindPopup(`
                <b>${request['Customer Name']}</b><br>
                Address: ${request['Customer Address']}<br>
                Appliance: ${request['Appliance Type']}<br>
                Problem: ${request['Problem Description']}<br>
                Priority: <b>${request['Severity/Priority']}</b><br>
                Status: ${request.Status}<br>
                Scheduled: ${request['Scheduled Date/Time'] || 'N/A'}<br>
                Contact: ${request['Contact Number'] || 'N/A'}
                <br><br><button data-request-id="${request['Service Request ID']}" class="assign-btn">Select for Route</button>
            `);

            // Store the full request data on the marker object for easy access later
            marker.requestData = request;

            // Add click listener to the marker to select it for routing
            marker.on('click', function(e) {
                // When marker is clicked, also handle selection in the sidebar list
                selectServiceRequest(e.target.requestData);
                // Optionally open the popup if it's not already open by default
                e.target.openPopup();
            });

            // Add click listener to the button inside the popup
            marker.on('popupopen', function() {
                const assignBtn = document.querySelector(`.assign-btn[data-request-id="${request['Service Request ID']}"]`);
                if (assignBtn) {
                    assignBtn.onclick = () => {
                        selectServiceRequest(request);
                        map.closePopup(); // Close popup after selection
                    };
                }
            });
        }
    });

    // Add technicians to the map
    allTechnicians.forEach(tech => {
        // Ensure valid coordinates exist
        if (tech['Current Location (Lat)'] && tech['Current Location (Lon)']) {
            const marker = L.marker([tech['Current Location (Lat)'], tech['Current Location (Lon)']], {
                icon: technicianIcon // Use the custom technician icon
            }).addTo(technicianLayer); // Add to the technician layer

            // Bind a popup to the technician marker
            marker.bindPopup(`
                <b>${tech['Technician Name']}</b><br>
                ID: ${tech['Technician ID']}<br>
                Skills: ${tech['Skills/Specialties']}<br>
                Status: ${tech['Availability Status']}
                <br><br><button data-tech-id="${tech['Technician ID']}" class="assign-btn">Select for Route</button>
            `);
            // Store the full technician data on the marker object
            marker.techData = tech;

            // Add click listener to the marker to select it for routing
            marker.on('click', function(e) {
                selectTechnician(e.target.techData);
                e.target.openPopup();
            });

            // Add click listener to the button inside the popup
            marker.on('popupopen', function() {
                const assignBtn = document.querySelector(`.assign-btn[data-tech-id="${tech['Technician ID']}"]`);
                if (assignBtn) {
                    assignBtn.onclick = () => {
                        selectTechnician(tech);
                        map.closePopup();
                    };
                }
            });
        }
    });
}

// --- 6. Render Sidebar Lists and Interaction ---
function renderSidebarLists() {
    // Clear existing lists in the sidebar
    requestListElement.innerHTML = '';
    technicianListElement.innerHTML = '';

    // Filter service requests based on the selected priority (from dropdown)
    const selectedPriority = priorityFilter.value;
    const filteredRequests = allServiceRequests.filter(request => {
        return selectedPriority === 'All' || request['Severity/Priority'] === selectedPriority;
    });

    // Update the pending count display
    pendingCountSpan.textContent = filteredRequests.length;

    // Populate service requests list in the sidebar
    filteredRequests.forEach(request => {
        const listItem = document.createElement('li');
        listItem.textContent = `${request['Service Request ID']} - ${request['Customer Name']} (${request['Appliance Type']}) - Priority: ${request['Severity/Priority']}`;
        listItem.dataset.requestId = request['Service Request ID']; // Store ID for easy lookup

        // Add CSS class for priority color (defined in style.css)
        listItem.classList.add(`priority-${request['Severity/Priority'].toLowerCase()}`);

        // Highlight the list item if it's currently selected for routing
        if (selectedServiceRequest && selectedServiceRequest['Service Request ID'] === request['Service Request ID']) {
            listItem.classList.add('selected');
        }

        // Add click listener to sidebar list item
        listItem.addEventListener('click', () => {
            selectServiceRequest(request); // Select the request
            // Optionally, zoom to the selected request on the map
            if (request.Latitude && request.Longitude) {
                map.setView([request.Latitude, request.Longitude], 15); // Zoom to request location
            }
        });
        requestListElement.appendChild(listItem);
    });

    // Populate technician list in the sidebar
    allTechnicians.forEach(tech => {
        const listItem = document.createElement('li');
        listItem.textContent = `${tech['Technician Name']} (${tech['Availability Status']})`;
        listItem.dataset.techId = tech['Technician ID']; // Store ID for easy lookup

        // Highlight the list item if it's currently selected for routing
        if (selectedTechnician && selectedTechnician['Technician ID'] === tech['Technician ID']) {
            listItem.classList.add('selected');
        }

        // Add click listener to sidebar list item
        listItem.addEventListener('click', () => {
            selectTechnician(tech); // Select the technician
            // Optionally, zoom to the selected technician on the map
            if (tech['Current Location (Lat)'] && tech['Current Location (Lon)']) {
                map.setView([tech['Current Location (Lat)'], tech['Current Location (Lon)']], 15); // Zoom to technician location
            }
        });
        technicianListElement.appendChild(listItem);
    });
}

// --- 7. Selection Logic for Routing ---

// Function to handle selection of a technician
function selectTechnician(tech) {
    // If a technician was previously selected, remove its 'selected' class from the list item
    if (selectedTechnician) {
        const prevItem = technicianListElement.querySelector(`li[data-tech-id="${selectedTechnician['Technician ID']}"]`);
        if (prevItem) prevItem.classList.remove('selected');
    }
    selectedTechnician = tech; // Set the new selected technician

    // Add 'selected' class to the current technician's list item
    const newItem = technicianListElement.querySelector(`li[data-tech-id="${selectedTechnician['Technician ID']}"]`);
    if (newItem) newItem.classList.add('selected');

    console.log('Selected Technician:', selectedTechnician['Technician Name']);
    drawRouteIfReady(); // Attempt to draw route if both technician and request are selected
}

// Function to handle selection of a service request
function selectServiceRequest(request) {
    // If a request was previously selected, remove its 'selected' class from the list item
    if (selectedServiceRequest) {
        const prevItem = requestListElement.querySelector(`li[data-request-id="${selectedServiceRequest['Service Request ID']}"]`);
        if (prevItem) prevItem.classList.remove('selected');
    }
    selectedServiceRequest = request; // Set the new selected request

    // Add 'selected' class to the current request's list item
    const newItem = requestListElement.querySelector(`li[data-request-id="${selectedServiceRequest['Service Request ID']}"]`);
    if (newItem) newItem.classList.add('selected');

    console.log('Selected Service Request:', selectedServiceRequest['Customer Name']);
    drawRouteIfReady(); // Attempt to draw route if both technician and request are selected
}

// Function to draw the route if both a technician and a service request are selected
function drawRouteIfReady() {
    if (selectedTechnician && selectedServiceRequest) {
        // Remove any existing routing control before drawing a new one
        if (routingControl) {
            map.removeControl(routingControl);
        }

        // Create a new Leaflet Routing Machine control
        routingControl = L.Routing.control({
            waypoints: [
                // Start waypoint: Technician's location
                L.latLng(selectedTechnician['Current Location (Lat)'], selectedTechnician['Current Location (Lon)']),
                // End waypoint: Service Request's location
                L.latLng(selectedServiceRequest.Latitude, selectedServiceRequest.Longitude)
            ],
            // Use OSRM (Open Source Routing Machine) public server
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'driving' // Specify 'driving', 'walking', or 'cycling'
            }),
            routeWhileDragging: false, // Don't recalculate route while dragging waypoints
            showAlternatives: false, // Don't show alternative routes
            addWaypoints: false, // Don't allow adding more waypoints on the map by clicking
            lineOptions: {
                styles: [{ color: '#007bff', weight: 5, opacity: 0.7 }] // Styling for the route line (blue, medium thickness)
            },
            // Do not display default route instructions container on map
            altContainer: document.createElement('div')
        }).addTo(map);

        // Fit the map view to the bounds of the calculated route
        routingControl.on('routesfound', function(e) {
            const route = e.routes[0];
            if (route && route.coordinates) {
                // Create a LatLngBounds object from the route's coordinates
                const bounds = L.latLngBounds(route.coordinates[0], route.coordinates[0]);
                route.coordinates.forEach(coord => {
                    bounds.extend(coord);
                });
                map.fitBounds(bounds, { padding: [50, 50] }); // Fit map to route with some padding
            }
        });
    }
}

// --- 8. Event Listeners ---

// Listen for changes in the priority filter dropdown
priorityFilter.addEventListener('change', renderSidebarLists);

// Listen for click on the "Clear Route" button
clearRouteButton.addEventListener('click', () => {
    // If a routing control exists, remove it from the map
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null; // Reset the routing control variable
    }

    // Clear selections in the sidebar lists
    if (selectedTechnician) {
        const prevItem = technicianListElement.querySelector(`li[data-tech-id="${selectedTechnician['Technician ID']}"]`);
        if (prevItem) prevItem.classList.remove('selected');
        selectedTechnician = null; // Reset selected technician
    }
    if (selectedServiceRequest) {
        const prevItem = requestListElement.querySelector(`li[data-request-id="${selectedServiceRequest['Service Request ID']}"]`);
        if (prevItem) prevItem.classList.remove('selected');
        selectedServiceRequest = null; // Reset selected service request
    }
});


// --- 9. Initial Data Load ---
// This function is called when the script first runs to load and display data.
loadData();
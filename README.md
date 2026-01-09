# Mockify

**Mockify** is a powerful, developer-centric browser extension designed to intercept and modify HTTP network requests in real-time. Whether you are debugging frontend issues, simulating edge cases, or developing without a backend, Mockify gives you full control over your application's data flow.

**Supported Browsers:** Chrome, Firefox, and other Chromium-based browsers.

## Getting Started

### Installation (Stable Release)

#### Chrome / Chromium-based Browsers

1. Go to the [Mockify Releases](https://github.com/KidiXDev/mockify/releases) page.
2. Download the latest `mockify-x.x.x.zip` file.
3. Extract the contents of the ZIP file to a permanent folder on your computer.
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** in the top right corner.
   - Click the **Load unpacked** button.
   - Select the extracted folder (the one containing `manifest.json`).

#### Firefox

1. Go to the [Mockify Releases](https://github.com/KidiXDev/mockify/releases) page.
2. Download the latest `mockify-x.x.x.zip` file.
3. Extract the contents of the ZIP file to a permanent folder on your computer.
4. Load the extension in Firefox:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on**.
   - Navigate to the extracted folder and select the `manifest.json` file.

### Installation (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/kidixdev/mockify.git
   cd mockify
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Build the extension:
   ```bash
   npm run build
   # or
   bun run build
   ```

4. Load the extension in your browser:
   
   **Chrome / Chromium-based browsers:**
   - Go to `chrome://extensions/`
   - Enable **Developer mode**.
   - Click **Load unpacked**.
   - Select the `dist` folder generated in your project directory.
   
   **Firefox:**
   - Go to `about:debugging#/runtime/this-firefox`
   - Click **Load Temporary Add-on**.
   - Navigate to the `dist` folder and select the `manifest.json` file.

## Usage

1. Click the **Mockify** icon in your browser toolbar or open the **Options** page.
2. Click **Create New Rule**.
3. Enter the URL substring you want to intercept (e.g., `/api/user`).
4. Select the response type (**JSON** or **Text**).
5. Paste your mocked response content.
6. Save the rule and ensure the global switch is **ACTIVE**.

## Todo

- [x] **Regex Matching**: Support for Regular Expressions in URL matching logic.
- [x] **HTTP Status Codes**: Allow setting custom status codes (e.g., 201, 400, 404, 500).
- [ ] **Response Headers**: Mock specific HTTP response headers like `Set-Cookie` or `Authorization`.
- [x] **Delay Simulation**: Simulate network latency by adding a custom delay (in milliseconds) to mocked responses.
- [x] **JSON Syntax Highlighting**: Integrate a powerful code editor (like Monaco or CodeMirror) for the mock response textarea.
- [x] **Import/Export**: Bulk import/export rules via JSON files for sharing with teammates.
- [ ] **Rule Grouping**: Organize rules into folders or tags for better management of large projects.
- [x] **Profile Switching**: Switch between different sets of rules (e.g., "Development", "Staging", "Edge Cases").
- [ ] **GraphQL Support**: Match requests based on GraphQL `OperationName` or body content.
- [ ] **Rule Priorities**: Drag-and-drop to reorder rules and define execution priority.
- [x] **Replay**: Replay mocked responses for debugging and testing.


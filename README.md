# Mockify

**Mockify** is a powerful, developer-centric Chrome Extension designed to intercept and modify HTTP network requests in real-time. Whether you are debugging frontend issues, simulating edge cases, or developing without a backend, Mockify gives you full control over your application's data flow.

## Getting Started

### Installation (Stable Release)

1. Go to the [Reactions Releases](https://github.com/KidiXDev/mockify/releases) page.
2. Download the latest `mockify-x.x.x.zip` file.
3. Extract the contents of the ZIP file to a permanent folder on your computer.
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** in the top right corner.
   - Click the **Load unpacked** button.
   - Select the extracted folder (the one containing `manifest.json`).

### Installation (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/kidixdev/mockify.git
   cd mockify
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the development server:
   ```bash
   bun dev
   ```

4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**.
   - Click **Load unpacked**.
   - Select the `dist` folder generated in your project directory.

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


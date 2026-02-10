# Publishing Squiggle to the Chrome Web Store

This guide walks you through the process of publishing the Squiggle extension to the Chrome Web Store.

## Prerequisites

- A Google Account.
- A ZIP file of your extension (run `./run.sh package` to generate this).
- $5 one-time registration fee (if you haven't paid it already).

## Instructions

1.  **Register a Developer Account**
    *   Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
    *   Sign in with your Google Account.
    *   If this is your first time, you will be prompted to pay the **$5 one-time registration fee**.

2.  **Package Your Extension**
    *   In your terminal, run:
        ```bash
        ./run.sh package
        ```
    *   This will create a file named `extension.zip` in the current directory.

3.  **Create a New Item**
    *   In the Developer Dashboard, click the **+ New Item** button (top right).
    *   Drag and drop your `extension.zip` file into the upload window.

4.  **Fill in Store Listing**
    *   **Snippet**: A short summary of your extension.
    *   **Description**: A detailed description of what Squiggle does.
    *   **Category**: Select "Sports" or "Productivity".
    *   **Language**: English.
    *   **Graphic Assets**:
        *   **Icon**: 128x128 px PNG (you can use `extension/icons/icon-128.png`).
        *   **Screenshots**: Upload at least one screenshot (1280x800 or 640x400 recommended).
        *   **Marquee Tile** (Optional): 440x280 px.

5.  **Privacy Practices**
    *   Go to the **Privacy** tab.
    *   check off the permissions you use.
    *   Justify `storage` permission ("Used to save plays locally").
    *   **Privacy Policy URL**: You need a public URL for your policy.
        *   **Option 1 (Fastest):** Copy the text from `PRIVACY.md`, go to [gist.github.com](https://gist.github.com), paste it, save as "Public Gist", and use the "Raw" button URL.
        *   **Option 2 (Repo):** Push your code to GitHub, browse to `squiggle-extension/PRIVACY.md`, and click "Raw".


6.  **Submit for Review**
    *   Click **Submit for Review** (top right).
    *   The review process typically takes 1-3 days.

## Updating Your Extension

When you have a new version (e.g., 1.0.1):
1.  Update the `version` number in `squiggle-ui/public/manifest.json`.
2.  Run `./run.sh package`.
3.  Go to the Developer Dashboard, select "Squiggle", and upload the new `extension.zip`.
4.  Submit for review.

# Self Assessment multi-device sync

This dashboard's Self Assessment records are stored locally by default. To share records between devices, configure the Google Apps Script endpoint below once per browser/device.

## Set up shared storage

1. Create a Google Spreadsheet dedicated to Self Assessment (or use a spreadsheet with appropriate access controls).
2. In that spreadsheet, open **Extensions → Apps Script**.
3. Replace the editor content with the complete code in `assessment-sync/Code.gs`.
4. Save the project.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as** to your account (the spreadsheet owner).
7. Set access to **Anyone with a Google account** where available. The users who submit or view the data must be signed in to an authorized Google account. Avoid public anonymous access for employee evaluation data.
8. Deploy and authorize the script. Copy the Web app URL ending in `/exec`.

The script creates a sheet named `AssessmentData` automatically and appends submitted assessments. It does not overwrite existing records.

## Connect the dashboard

1. Open the published dashboard.
2. Open **Rekap Self Assessment Tersimpan** and unlock it.
3. In **Sinkronisasi Multi-Device**, paste the Web app URL into the URL field.
4. Click **Simpan URL & Sinkronkan**.
5. Repeat the URL setup on each device/browser that needs access to the shared assessment records.

When the URL is saved, the dashboard uploads that browser's existing local records and retrieves the cloud records. Newly submitted assessments are sent to the shared spreadsheet. The dashboard also refreshes shared assessment data periodically while it remains open.

## Important

- The Web app URL is an endpoint, not a password. Protect the spreadsheet and deploy with account-based access; assessment answers contain employee performance information.
- Existing local records are migrated when you first click **Simpan URL & Sinkronkan** on the device where those records were submitted.
- Local browser storage is retained as a cache. Do not clear site data before the records have been successfully synchronized.
- This is append-only synchronization: it deduplicates records by assessment ID and does not edit/delete submitted records.

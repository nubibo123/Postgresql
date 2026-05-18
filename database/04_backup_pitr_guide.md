# PostgreSQL Backup & Point-In-Time Recovery (PITR) Guide

This document outlines the standard procedures for managing backups and disaster recovery for the SecureBank database.

## 1. Logical Backup & Restore

Logical backups export data into a file that can be restored later.

### Backup Database (`pg_dump`)
Run this command from your terminal to back up the database into a custom-format dump file:

```bash
pg_dump -U postgres -F c -f securebank_backup.dump postgres
```
- `-U postgres`: The database user.
- `-F c`: Format is custom (compressed, recommended for large databases).
- `-f`: Output file name.
- `postgres`: The name of the database to back up.

### Restore Database (`pg_restore`)
To restore the backup into a new or empty database:

```bash
# Create a fresh database if needed
createdb -U postgres securebank_restored

# Restore the dump file
pg_restore -U postgres -d securebank_restored -1 securebank_backup.dump
```
- `-d`: Target database.
- `-1`: Execute restore as a single transaction (all or nothing).

---

## 2. Point-In-Time Recovery (PITR) Workflow

Point-In-Time Recovery allows you to restore the database to an exact moment in time (e.g., right before an accidental `DROP TABLE` or massive incorrect data update). This requires setting up **WAL (Write-Ahead Logging) Archiving**.

### Step 1: Configure `postgresql.conf` for WAL Archiving
Locate your `postgresql.conf` file (you can find it by running `SHOW config_file;` in psql) and modify the following settings:

```ini
# Enable WAL archiving
wal_level = replica 
archive_mode = on

# Define the command to copy WAL files to an archive directory
# (Ensure the archive directory exists and postgres has write permissions)
archive_command = 'copy "%p" "C:\\path\\to\\your\\wal_archive\\%f"' 
# On Linux/macOS: archive_command = 'cp %p /path/to/archive/%f'
```

Restart the PostgreSQL server for changes to take effect.

### Step 2: Take a Base Backup
A base backup is required as a starting point for PITR. Use the `pg_basebackup` utility:

```bash
pg_basebackup -U postgres -D "C:\path\to\your\base_backup" -F p -X stream -P
```

### Step 3: Performing the Recovery
If a disaster occurs, follow these steps to recover:

1. **Stop the PostgreSQL Server**.
2. **Move the current data directory** (don't delete it, just rename it to `data_corrupted`).
3. **Restore the Base Backup** into the original data directory location.
4. **Create a `recovery.signal` file** in the newly restored data directory (this tells PostgreSQL to enter recovery mode upon startup).
5. **Configure `postgresql.conf` for Recovery Target**:
   Append these settings to tell PostgreSQL where to find the archived WAL files and when to stop recovering.

   ```ini
   restore_command = 'copy "C:\\path\\to\\your\\wal_archive\\%f" "%p"'
   # On Linux/macOS: restore_command = 'cp /path/to/archive/%f %p'
   
   # Example: Recover to a specific timestamp
   recovery_target_time = '2026-05-17 12:00:00+07' 
   
   # Action to take once the target is reached (promote means make it a primary server)
   recovery_target_action = 'promote'
   ```

6. **Start the PostgreSQL Server**. It will read the base backup, apply the WAL files up to the specified time, and then become available for connections.

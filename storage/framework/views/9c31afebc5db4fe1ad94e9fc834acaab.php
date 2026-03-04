
#!/usr/bin/env sh

# Run user scripts, if they exist
for f in /var/www/html/.fly/scripts/*.sh; do
    # Bail out this loop if any script exits with non-zero status code
    bash "$f" -e
done

if [ $# -gt 0 ]; then
    # If we passed a command, run it as root
    exec "$@"
else
    exec supervisord -c /etc/supervisor/supervisord.conf
fi<?php /**PATH phar://C:/Users/Jere Guale/Desktop/gim_app1.1/gym-app/vendor/fly-apps/dockerfile-laravel/builds/dockerfile-laravel\resources\views/fly/entrypoint.blade.php ENDPATH**/ ?>
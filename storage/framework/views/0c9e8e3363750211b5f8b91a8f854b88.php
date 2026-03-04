
#!/usr/bin/env bash

/usr/bin/php /var/www/html/artisan config:cache --no-ansi -q
/usr/bin/php /var/www/html/artisan route:cache --no-ansi -q
/usr/bin/php /var/www/html/artisan view:cache --no-ansi -q<?php /**PATH phar://C:/Users/Jere Guale/Desktop/gim_app1.1/gym-app/vendor/fly-apps/dockerfile-laravel/builds/dockerfile-laravel\resources\views/fly/scripts/caches.blade.php ENDPATH**/ ?>
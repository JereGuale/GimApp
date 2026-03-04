
# excludes from the docker image/build

# 1. Ignore Laravel-specific files we don't need
bootstrap/cache/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
storage/logs/*
<?php if( !$dev ): ?>
*.env*
<?php endif; ?>
.rr.yml
rr
frankenphp
vendor

# 2. Ignore common files/directories we don't need
fly.toml
.vscode
.idea
**/*node_modules
**.git
**.gitignore
**.gitattributes
**.sass-cache
**/*~
**/*.log
**/.DS_Store
**/Thumbs.db
public/hot<?php /**PATH phar://C:/Users/Jere Guale/Desktop/gim_app1.1/gym-app/vendor/fly-apps/dockerfile-laravel/builds/dockerfile-laravel\resources\views/fly/dockerignore.blade.php ENDPATH**/ ?>
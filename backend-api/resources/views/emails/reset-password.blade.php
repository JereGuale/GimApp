<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f172a;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .header {
            background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 32px;
            color: #cbd5e1;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #f1f5f9;
        }
        .message {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .code-container {
            background: linear-gradient(135deg, #22d3ee15 0%, #06b6d415 100%);
            border: 2px solid #22d3ee;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            color: #94a3b8;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .code {
            font-size: 42px;
            font-weight: 900;
            color: #22d3ee;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .expiry {
            margin-top: 20px;
            padding: 12px;
            background: rgba(251, 146, 60, 0.1);
            border-left: 3px solid #fb923c;
            border-radius: 4px;
            font-size: 14px;
            color: #fb923c;
        }
        .footer {
            padding: 24px 32px;
            background: #0f172a;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            border-top: 1px solid #1e293b;
        }
        .warning {
            margin-top: 24px;
            padding: 16px;
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
            border-radius: 4px;
            font-size: 13px;
            color: #fca5a5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️ Gym App</h1>
        </div>
        
        <div class="content">
            <div class="greeting">¡Hola!</div>
            
            <div class="message">
                Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de verificación en la aplicación:
            </div>
            
            <div class="code-container">
                <div class="code-label">Tu Código de Verificación</div>
                <div class="code">{{ $code }}</div>
            </div>
            
            <div class="expiry">
                ⏱ Este código expirará en <strong>15 minutos</strong>
            </div>
            
            <div class="warning">
                <strong>⚠️ Atención:</strong> Si no solicitaste este cambio, ignora este email. Tu contraseña permanecerá segura.
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>&copy; 2026 Gym App. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>

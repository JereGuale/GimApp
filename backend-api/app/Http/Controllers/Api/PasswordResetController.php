<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Request password reset code
     */
    public function requestReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Delete old codes for this email
        DB::table('password_reset_codes')
            ->where('email', $request->email)
            ->delete();

        // Store new code (expires in 15 minutes)
        DB::table('password_reset_codes')->insert([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(15),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Send email with code
        try {
            Mail::to($request->email)->send(new ResetPasswordMail($code));
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el código. Verifica la configuración de email.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Código enviado a tu email. Revisa tu bandeja de entrada.'
        ]);
    }

    /**
     * Verify reset code
     */
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        $resetCode = DB::table('password_reset_codes')
            ->where('email', $request->email)
            ->where('code', $request->code)
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Código incorrecto.',
                'valid' => false
            ], 400);
        }

        // Check if expired
        if (Carbon::parse($resetCode->expires_at)->isPast()) {
            DB::table('password_reset_codes')
                ->where('email', $request->email)
                ->delete();

            return response()->json([
                'message' => 'El código ha expirado. Solicita uno nuevo.',
                'valid' => false
            ], 400);
        }

        return response()->json([
            'message' => 'Código verificado correctamente.',
            'valid' => true
        ]);
    }

    /**
     * Reset password
     */
    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed'
        ]);

        // Verify code again
        $resetCode = DB::table('password_reset_codes')
            ->where('email', $request->email)
            ->where('code', $request->code)
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Código incorrecto.'
            ], 400);
        }

        if (Carbon::parse($resetCode->expires_at)->isPast()) {
            DB::table('password_reset_codes')
                ->where('email', $request->email)
                ->delete();

            return response()->json([
                'message' => 'El código ha expirado. Solicita uno nuevo.'
            ], 400);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete used code
        DB::table('password_reset_codes')
            ->where('email', $request->email)
            ->delete();

        return response()->json([
            'message' => 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        ]);
    }
}

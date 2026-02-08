// generateAdmin.js
// Script untuk generate akun admin otomatis
// Run: node generateAdmin.js

import { createClient } from '@supabase/supabase-js';

// =====================================
// KONFIGURASI SUPABASE
// =====================================
// Ganti dengan credentials Supabase Anda
const SUPABASE_URL = 'https://dkcpgtlsvuudcgtfpinv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WvD0i9ziIw6f4XjgZnPnng_wVNwyz4S';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================
// DATA ADMIN DEFAULT
// =====================================
const adminData = {
  nama: 'Administrator',
  nik: '0000000000000000',
  wbp: 'SYSTEM ADMIN',
  username: 'admin',
  password: 'admin123',
  alamat: 'Lapas Kerobokan',
  blok_wbp: '-',
  email: 'admin@sipena.com',
  hubungan: 'Admin',
  is_approved: true,
  kamar_wbp: '-',
  wa: '-',
  foto_ktp_url: null
};

// =====================================
// FUNGSI GENERATE ADMIN
// =====================================
async function generateAdmin() {
  console.log('🚀 Memulai proses generate akun admin...\n');

  try {
    // 1. Cek apakah admin sudah ada
    console.log('🔍 Mengecek apakah admin sudah terdaftar...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (existingAdmin) {
      console.log('⚠️  Admin sudah ada di database!');
      console.log('📋 Data Admin:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Nama: ${existingAdmin.nama}`);
      console.log(`   Status: ${existingAdmin.is_approved ? 'Approved ✅' : 'Pending'}`);
      
      // Tanya apakah mau update password
      console.log('\n💡 Jika ingin reset password admin, hapus dulu akun admin dari database');
      return;
    }

    // 2. Insert admin baru
    console.log('✍️  Membuat akun admin baru...');
    const { data, error } = await supabase
      .from('users')
      .insert([adminData])
      .select();

    if (error) {
      throw error;
    }

    // 3. Sukses
    console.log('\n✅ AKUN ADMIN BERHASIL DIBUAT!\n');
    console.log('═══════════════════════════════════');
    console.log('📝 DETAIL LOGIN ADMIN:');
    console.log('═══════════════════════════════════');
    console.log(`👤 Username : admin`);
    console.log(`🔐 Password : admin123`);
    console.log(`✅ Status   : Approved`);
    console.log('═══════════════════════════════════\n');
    console.log('🎉 Silakan login dengan kredensial di atas!');

  } catch (error) {
    console.error('\n❌ ERROR: Gagal membuat akun admin');
    console.error('📛 Detail Error:', error.message);
    
    if (error.code === '23505') {
      console.log('\n💡 Tip: Username "admin" sudah digunakan. Gunakan username lain atau hapus admin yang lama.');
    }
  }
}

// =====================================
// FUNGSI RESET PASSWORD ADMIN
// =====================================
async function resetAdminPassword() {
  console.log('🔄 Mereset password admin...\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ password: 'admin123' })
      .eq('username', 'admin')
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log('✅ Password admin berhasil direset!');
      console.log('🔐 Password baru: admin123');
    } else {
      console.log('⚠️  Admin tidak ditemukan di database');
    }

  } catch (error) {
    console.error('❌ ERROR: Gagal reset password');
    console.error('📛 Detail:', error.message);
  }
}

// =====================================
// FUNGSI DELETE ADMIN
// =====================================
async function deleteAdmin() {
  console.log('🗑️  Menghapus akun admin...\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('username', 'admin')
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log('✅ Akun admin berhasil dihapus!');
    } else {
      console.log('⚠️  Admin tidak ditemukan di database');
    }

  } catch (error) {
    console.error('❌ ERROR: Gagal menghapus admin');
    console.error('📛 Detail:', error.message);
  }
}

// =====================================
// MENU UTAMA
// =====================================
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n╔════════════════════════════════════╗');
  console.log('║   🛡️  SIPENA ADMIN GENERATOR 🛡️   ║');
  console.log('╚════════════════════════════════════╝\n');

  switch (command) {
    case 'create':
      await generateAdmin();
      break;
    case 'reset':
      await resetAdminPassword();
      break;
    case 'delete':
      await deleteAdmin();
      break;
    default:
      console.log('📖 CARA PENGGUNAAN:');
      console.log('   node generateAdmin.js create  - Buat akun admin baru');
      console.log('   node generateAdmin.js reset   - Reset password admin');
      console.log('   node generateAdmin.js delete  - Hapus akun admin\n');
      await generateAdmin(); // Default action
  }

  console.log('\n✨ Selesai!\n');
}

// =====================================
// JALANKAN SCRIPT
// =====================================
main();
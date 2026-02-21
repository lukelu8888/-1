<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_rfq_quotes', function (Blueprint $table) {
            $table->string('quotation_no', 128)->nullable()->after('remarks');
            $table->json('quote_data')->nullable()->after('quotation_no');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_rfq_quotes', function (Blueprint $table) {
            $table->dropColumn(['quotation_no', 'quote_data']);
        });
    }
};

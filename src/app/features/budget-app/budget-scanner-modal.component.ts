import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ScannedReceiptData {
  merchant: string;
  total: number;
  date: string;
  items: { name: string; price: number; isImpulse?: boolean }[];
  aiAnalysis: string;
}

@Component({
  selector: 'app-budget-scanner-modal',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (state.isScannerModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      >
        <div
          class="relative w-full max-w-lg rounded-3xl bg-[#111827] border border-purple-500/30 p-6 shadow-2xl space-y-4"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2 text-purple-400 font-bold">
              <span>📸</span>
              <h3 class="text-base text-white">Skaner Paragonów OCR & AI</h3>
            </div>
            <button
              type="button"
              (click)="state.isScannerModalOpen.set(false)"
              class="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          @if (!scannedData()) {
            <!-- Upload / Camera Drop Area -->
            <div class="space-y-4">
              <div
                (click)="fileInput.click()"
                class="p-8 rounded-3xl border-2 border-dashed border-slate-700 hover:border-purple-400 bg-slate-900/60 hover:bg-slate-900 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
              >
                <div
                  class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl text-purple-400"
                >
                  📷
                </div>
                <div>
                  <span class="font-bold text-white text-sm block"
                    >Zrób zdjęcie lub wgraj plik</span
                  >
                  <span class="text-xs text-slate-400 mt-1 block">Obsługiwane: JPG, PNG, PDF</span>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20"
                >
                  Wybierz paragon
                </button>
              </div>

              <!-- Quick Demo Samples -->
              <div class="pt-2">
                <span class="text-xs text-slate-500 font-semibold block mb-2"
                  >Lub przetestuj przykładowy paragon demo:</span
                >
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    (click)="simulateOcrScan('biedronka')"
                    class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-left text-slate-300 font-medium"
                  >
                    🛒 Biedronka (112,40 zł)
                  </button>
                  <button
                    type="button"
                    (click)="simulateOcrScan('orlen')"
                    class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-left text-slate-300 font-medium"
                  >
                    ⛽ Stacja Orlen (245,00 zł)
                  </button>
                </div>
              </div>

              <input
                #fileInput
                type="file"
                accept="image/*,.pdf"
                (change)="onFileUploaded($event)"
                class="hidden"
              />
            </div>
          } @else {
            <!-- OCR Result & AI Extraction Display -->
            <div class="space-y-4 animate-in fade-in text-xs">
              <!-- Merchant & Total -->
              <div
                class="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between"
              >
                <div>
                  <span class="text-[10px] uppercase font-bold text-purple-400"
                    >Rozpoznany sklep</span
                  >
                  <h4 class="text-lg font-black text-white">{{ scannedData()!.merchant }}</h4>
                  <span class="text-slate-400">{{ scannedData()!.date }}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] uppercase font-bold text-purple-400">Suma</span>
                  <div class="text-xl font-black text-white font-mono">
                    -{{ scannedData()!.total.toFixed(2) }} zł
                  </div>
                </div>
              </div>

              <!-- Extracted Items -->
              <div>
                <span class="font-bold text-slate-300 block mb-1.5"
                  >Rozpoznane pozycje z paragonu:</span
                >
                <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  @for (item of scannedData()!.items; track item.name) {
                    <div
                      class="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800"
                    >
                      <div class="flex items-center gap-2">
                        <span>{{ item.isImpulse ? '🍬' : '✓' }}</span>
                        <span class="text-slate-200">{{ item.name }}</span>
                        @if (item.isImpulse) {
                          <span
                            class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] border border-amber-500/20"
                            >Zachcianka</span
                          >
                        }
                      </div>
                      <span class="font-mono text-slate-300">{{ item.price.toFixed(2) }} zł</span>
                    </div>
                  }
                </div>
              </div>

              <!-- AI Analysis -->
              <div
                class="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 text-purple-200 flex items-start gap-2"
              >
                <span class="text-purple-400 text-sm">✨</span>
                <p class="leading-relaxed">
                  <strong class="text-purple-400 font-semibold">Komentarz AI:</strong>
                  {{ scannedData()!.aiAnalysis }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  (click)="scannedData.set(null)"
                  class="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Skanuj inny
                </button>

                <button
                  type="button"
                  (click)="addScannedToBudget()"
                  class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  Zatwierdź i dodaj wydatek
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class BudgetScannerModalComponent {
  readonly state = inject(BudgetStateService);
  readonly scannedData = signal<ScannedReceiptData | null>(null);

  onFileUploaded(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.simulateOcrScan('biedronka', file.name);
    }
  }

  simulateOcrScan(type: 'biedronka' | 'orlen', customFileName?: string) {
    Haptics.impact({ style: ImpactStyle.Heavy });
    if (type === 'orlen') {
      this.scannedData.set({
        merchant: 'Stacja Paliw PKN Orlen',
        total: 245.0,
        date: 'Dziś, 12:10',
        items: [
          { name: 'Verva 98 (38.5 L)', price: 232.0 },
          { name: 'Kawa duża Flat White', price: 13.0, isImpulse: true },
        ],
        aiAnalysis:
          'Paliwo stanowi 95% kwoty. Dodatkowo kawa na stacji (13 zł) zaliczona do drobnych zachcianek podróżnych.',
      });
    } else {
      this.scannedData.set({
        merchant: 'Biedronka Sp. z o.o.',
        total: 112.4,
        date: 'Dziś, 14:05',
        items: [
          { name: 'Pieczywo i Masło', price: 18.5 },
          { name: 'Filet z piersi kurczaka', price: 34.2 },
          { name: 'Warzywa i Owoce', price: 28.1 },
          { name: 'Czekolada Milka + Chipsy', price: 31.6, isImpulse: true },
        ],
        aiAnalysis:
          'Rozpoznano paragon z Biedronki. Produkty pierwszej potrzeby: 80,80 zł (72%). Słodycze i przekąski: 31,60 zł (28% zachcianek).',
      });
    }
  }

  async addScannedToBudget() {
    const data = this.scannedData();
    if (!data) return;

    await Haptics.impact({ style: ImpactStyle.Medium });
    const now = new Date();

    this.state.addTransaction({
      title: data.merchant,
      amount: data.total,
      category: data.merchant.includes('Orlen') ? 'Transport' : 'Jedzenie',
      date: data.date,
      isoDate: now.toISOString().substring(0, 10),
      note: 'Zeskanowano aparatem OCR',
      tags: data.merchant.includes('Orlen') ? ['Potrzebne'] : ['Potrzebne', 'Spożywcze'],
      receiptFileName: 'paragon_ocr_' + now.getTime() + '.jpg',
      aiComment: data.aiAnalysis,
    });

    this.scannedData.set(null);
    this.state.isScannerModalOpen.set(false);
  }
}

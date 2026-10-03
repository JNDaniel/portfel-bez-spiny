import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent, 
  IonFab, 
  IonFabButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, refreshOutline, cameraOutline, micOutline, repeatOutline, alertCircleOutline, folderOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { BudgetStateService } from '../../core/services/budget-state.service';
import { BudgetHeroGaugeComponent } from './budget-hero-gauge.component';
import { BudgetTrendChartComponent } from './budget-trend-chart.component';
import { BudgetCategoriesComponent } from './budget-categories.component';
import { BudgetTransactionsComponent } from './budget-transactions.component';
import { BudgetAddModalComponent } from './budget-add-modal.component';
import { BudgetBankSimulatorComponent } from './budget-bank-simulator.component';
import { BudgetRadarWasteComponent } from './budget-radar-waste.component';
import { BudgetSubscriptionsComponent } from './budget-subscriptions.component';
import { BudgetScannerModalComponent } from './budget-scanner-modal.component';
import { BudgetVoiceModalComponent } from './budget-voice-modal.component';
import { BudgetCreateFolderModalComponent } from './budget-create-folder-modal.component';

@Component({
  selector: 'app-budget-main',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonIcon,
    BudgetHeroGaugeComponent,
    BudgetTrendChartComponent,
    BudgetCategoriesComponent,
    BudgetTransactionsComponent,
    BudgetAddModalComponent,
    BudgetBankSimulatorComponent,
    BudgetRadarWasteComponent,
    BudgetSubscriptionsComponent,
    BudgetScannerModalComponent,
    BudgetVoiceModalComponent,
    BudgetCreateFolderModalComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="bg-[#0b0f19] text-slate-100">
      <!-- Simulated Bank Push Notification Floating Bar -->
      <app-budget-bank-simulator></app-budget-bank-simulator>

      <!-- Native Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="refresh-outline" pullingText="Odśwież budżet"></ion-refresher-content>
      </ion-refresher>

      <div class="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <!-- Main Centered Container (Max 800px) matching screenshots -->
        <div class="w-full max-w-3xl space-y-6">
          
          <!-- Top Header: Logo + Month Navigator + Game Changer Quick Tools -->
          <header class="flex items-center justify-between px-2 pt-2">
            <!-- Left Logo -->
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm shadow-lg shadow-emerald-500/20">
                💰
              </div>
              <span class="font-extrabold text-sm md:text-base text-white tracking-tight">Budżet</span>
            </div>

            <!-- Center Month Navigator (Arrows with month name) -->
            <div class="flex items-center gap-3 text-slate-400">
              <button 
                type="button" 
                (click)="state.previousMonth()"
                title="Poprzedni miesiąc"
                class="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                &lsaquo;
              </button>

              <span class="text-xs md:text-sm font-bold text-slate-200 tracking-wide select-none min-w-[100px] text-center font-mono">
                {{ state.currentMonth().label }}
              </span>

              <button 
                type="button" 
                (click)="state.nextMonth()"
                title="Następny miesiąc"
                class="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                &rsaquo;
              </button>
            </div>

            <!-- Right Add Action Button -->
            <button 
              type="button" 
              (click)="openAddModal()"
              class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
            >
              <span>+</span>
              <span>Dodaj wydatek</span>
            </button>
          </header>

          <!-- GAME CHANGER QUICK ACTION TOOLBAR -->
          <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <!-- Bank Push Ingestion Test -->
            <button 
              type="button"
              (click)="state.triggerSampleBankNotification()"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>🔔</span>
              <span>Test Push z Banku</span>
            </button>

            <!-- OCR Scanner Modal -->
            <button 
              type="button"
              (click)="openScanner()"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>📸</span>
              <span>Skaner Paragonów</span>
            </button>

            <!-- Voice AI Modal -->
            <button 
              type="button"
              (click)="openVoice()"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>🎙️</span>
              <span>Głos AI</span>
            </button>

            <!-- Subscriptions Toggle -->
            <button 
              type="button"
              (click)="toggleSubscriptions()"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>🔄</span>
              <span>Subskrypcje</span>
            </button>

            <!-- Waste Radar Toggle -->
            <button 
              type="button"
              (click)="toggleWasteRadar()"
              class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>🚨</span>
              <span>Radar Zachcianek</span>
            </button>
          </div>

          <!-- 1. Hero Gauge Card (52% utilized, WYDANO / LIMIT / POZOSTAŁO + Safe-to-Spend Daily) -->
          <app-budget-hero-gauge></app-budget-hero-gauge>

          <!-- Modals & Drawers for Game Changers -->
          <app-budget-subscriptions></app-budget-subscriptions>
          <app-budget-radar-waste></app-budget-radar-waste>

          <!-- 2. Dual Row: Spending Trend Chart & Categories Progress Breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-5">
            <!-- Left: Wave Trend Chart (3 cols) -->
            <div class="md:col-span-3">
              <app-budget-trend-chart></app-budget-trend-chart>
            </div>

            <!-- Right: Categories List (2 cols) -->
            <div class="md:col-span-2">
              <app-budget-categories></app-budget-categories>
            </div>
          </div>

          <!-- 3. Transactions Ledger with Swipe Gestures, Folders, AI Comment & Period Summary -->
          <app-budget-transactions></app-budget-transactions>

        </div>
      </div>

      <!-- Mobile Floating Add Button -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="sm:hidden mb-6 mr-3">
        <ion-fab-button (click)="openAddModal()" aria-label="Dodaj wydatek" class="shadow-2xl">
          <ion-icon name="add" aria-hidden="true"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Add Expense Modal -->
      <app-budget-add-modal></app-budget-add-modal>

      <!-- Create Folder Modal -->
      <app-budget-create-folder-modal></app-budget-create-folder-modal>

      <!-- OCR Scanner Modal -->
      <app-budget-scanner-modal></app-budget-scanner-modal>

      <!-- Voice AI Modal -->
      <app-budget-voice-modal></app-budget-voice-modal>
    </ion-content>
  `
})
export class BudgetMainComponent {
  readonly state = inject(BudgetStateService);

  constructor() {
    addIcons({ add, refreshOutline, cameraOutline, micOutline, repeatOutline, alertCircleOutline, folderOutline });
  }

  async openAddModal() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isAddModalOpen.set(true);
  }

  async openScanner() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isScannerModalOpen.set(true);
  }

  async openVoice() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isVoiceModalOpen.set(true);
  }

  async toggleSubscriptions() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isSubscriptionsOpen.update(v => !v);
  }

  async toggleWasteRadar() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isWasteRadarOpen.update(v => !v);
  }

  async handleRefresh(event: any) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    setTimeout(() => {
      event.target.complete();
    }, 600);
  }
}

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-budget-folders-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="w-full space-y-2">
      <!-- Section Title & Add Action -->
      <div class="flex items-center justify-between px-1">
        <span
          class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5"
        >
          <span>📁</span>
          <span>Foldery & Wycieczki</span>
        </span>

        <button
          type="button"
          (click)="openCreateFolderModal()"
          class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
        >
          <span>+</span>
          <span>Nowy folder</span>
        </button>
      </div>

      <!-- Folders Horizontal Carousel -->
      <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <!-- 'Wszystkie' (All) Chip -->
        <button
          type="button"
          (click)="state.selectFolder(null)"
          class="shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition backdrop-blur-md"
          [ngClass]="
            state.selectedFolderId() === null
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
          "
        >
          <span>✨</span>
          <span>Wszystkie transakcje</span>
        </button>

        <!-- Folder Items -->
        @for (f of state.folders(); track f.id) {
          <div
            class="shrink-0 flex items-center rounded-2xl border transition group"
            [ngClass]="
              state.selectedFolderId() === f.id
                ? 'bg-slate-800/90 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
            "
          >
            <button
              type="button"
              (click)="state.selectFolder(f.id)"
              class="px-3 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <span>{{ f.emoji }}</span>
              <span>{{ f.name }}</span>
            </button>

            <!-- Delete Folder button -->
            <button
              type="button"
              (click)="deleteFolder(f.id, $event)"
              title="Usuń folder"
              class="pr-2 pl-1 text-slate-500 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        }
      </div>

      <!-- Active Folder Banner (if filtered) -->
      @if (state.activeFolder(); as folder) {
        <div
          class="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between text-xs animate-in fade-in"
        >
          <div class="flex items-center gap-2.5">
            <span class="text-lg">{{ folder.emoji }}</span>
            <div>
              <span class="font-bold text-white block">{{ folder.name }}</span>
              <span class="text-slate-400 text-[11px]"
                >Suma w folderze:
                <strong class="text-emerald-400 font-mono"
                  >{{ state.activeFolderTotal().toFixed(2) }} zł</strong
                ></span
              >
            </div>
          </div>
          <button
            type="button"
            (click)="state.selectFolder(null)"
            class="text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-800"
          >
            Pokaż wszystkie
          </button>
        </div>
      }
    </div>
  `,
})
export class BudgetFoldersBarComponent {
  readonly state = inject(BudgetStateService);

  async openCreateFolderModal() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.state.isCreateFolderModalOpen.set(true);
  }

  async deleteFolder(folderId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten folder? Transakcje nie zostaną usunięte.')) {
      await this.state.deleteFolder(folderId);
    }
  }
}

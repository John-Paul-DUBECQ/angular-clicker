import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-lore-message',
  templateUrl: './lore-message.component.html',
  styleUrls: ['./lore-message.component.css'],
})
export class LoreMessageComponent {
  /** Titre du popup (ex. nom d'acte). */
  @Input() title = '';
  /** Texte de lore principal. */
  @Input() text = '';
  /** URL d'image optionnelle affichée au-dessus du texte. */
  @Input() imageUrl: string | null = null;

  /** Émis quand le joueur ferme le popup. */
  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  /** Ferme le popup avec la touche Échap. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }
}

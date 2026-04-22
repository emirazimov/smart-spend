import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Важно для [(ngModel)]
import { FinanceService } from './services/finance.service'; // Путь к сервису

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // Добавляем сюда модули
  templateUrl: './app.component.html',   // Указывает на твой HTML файл
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  inputText = signal(''); // Используем Signal для ввода
  finance = inject(FinanceService); // Внедряем сервис (Dependency Injection)

  ngOnInit() {
    this.finance.loadHistory(); // Загружаем данные при старте
  }

  submit() {
    if (this.inputText().trim()) {
      this.finance.sendText(this.inputText());
      this.inputText.set(''); // Очищаем поле после отправки
    }
  }
}

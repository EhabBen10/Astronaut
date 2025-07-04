import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LegendFilterService {
    private selectedRangeSubject = new BehaviorSubject<string>('');
    public selectedRange$ = this.selectedRangeSubject.asObservable();

    setSelectedRange(range: string) {
        // If clicking the same range, clear the filter
        const currentRange = this.selectedRangeSubject.value;
        if (currentRange === range) {
            this.selectedRangeSubject.next('');
        } else {
            this.selectedRangeSubject.next(range);
        }
    }

    getSelectedRange(): string {
        return this.selectedRangeSubject.value;
    }

    clearFilter() {
        this.selectedRangeSubject.next('');
    }
}

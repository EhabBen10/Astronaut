import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CountrySelectionService {
    private selectedCountrySubject = new BehaviorSubject<string>('');
    public selectedCountry$ = this.selectedCountrySubject.asObservable();

    setSelectedCountry(country: string) {
        this.selectedCountrySubject.next(country);
    }

    getSelectedCountry(): string {
        return this.selectedCountrySubject.value;
    }
}

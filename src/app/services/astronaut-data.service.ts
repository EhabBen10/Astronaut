import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AstronautDataService {
    constructor(private http: HttpClient) { }

    // Mapping to fix name mismatches between JSON and GeoJSON
    private countryFixes: { [key: string]: string } = {
        "U.S.": "United States of America",
        "U.S.S.R/Russia": "Russia",
        "U.K.": "United Kingdom",
        "China, People's Republic": "China",
        // Add more if needed
    };

    getAstronautCounts(): Observable<{ [country: string]: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map((data) => {
                const seen = new Set<string>();
                const counts: { [country: string]: number } = {};

                for (const row of data) {
                    const name = row['Profile.Name']?.trim();
                    const rawNationality = row['Profile.Nationality']?.trim();

                    if (!name || !rawNationality) continue;

                    const nationality = this.countryFixes[rawNationality] || rawNationality;
                    const key = `${name}__${nationality}`;

                    if (!seen.has(key)) {
                        seen.add(key);
                        counts[nationality] = (counts[nationality] || 0) + 1;
                    }
                }

                return counts;
            })
        );
    }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AstronautDataService {
    constructor(private http: HttpClient) { }

    // Mapping to fix name mismatches between JSON and GeoJSON
    private countryFixes: { [key: string]: string } = {
        "U.S.": "United States of America", // Fix U.S. to full name
        "U.S.S.R/Russia": "Russia", // Treat as single country (Russia)
        "U.S.S.R/Ukraine": "Ukraine",
        "U.K.": "United Kingdom",
        "China, People's Republic": "China",
        // Add more if needed
    };

    // Check if a nationality should be treated as single country or split
    private shouldSplitNationality(nationality: string): boolean {
        // Don't split these USSR cases - treat as single countries
        if (nationality === "U.S.S.R/Russia") return false;
        if (nationality === "U.S.S.R/Ukraine") return false;

        // Split other multi-nationality strings like U.K./U.S.
        return nationality.includes('/') || nationality.includes(',');
    }

    private processNationality(rawNationality: string): string[] {
        const trimmed = rawNationality.trim();

        // Check if this should be split or treated as single
        if (this.shouldSplitNationality(trimmed)) {
            // Split and process each nationality
            return trimmed.split(/[\/,]/)
                .map((n: string) => this.countryFixes[n.trim()] || n.trim())
                .filter(n => n);
        } else {
            // Treat as single nationality (including U.S.S.R/Russia -> Russia)
            const fixed = this.countryFixes[trimmed] || trimmed;
            return [fixed];
        }
    }

    getAstronautCounts(): Observable<{ [country: string]: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map((data) => {
                const seen = new Set<string>();
                const counts: { [country: string]: number } = {};

                for (const row of data) {
                    const name = row['Profile.Name']?.trim();
                    const rawNationality = row['Profile.Nationality']?.trim();
                    if (!name || !rawNationality) continue;

                    // Use the new nationality processing helper
                    const nationalities = this.processNationality(rawNationality);

                    for (const nat of nationalities) {
                        const key = `${name}__${nat}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            counts[nat] = (counts[nat] || 0) + 1;
                        }
                    }
                }

                return counts;
            })
        );
    }

    getGenderDistributionByCountry(country: string): Observable<{ male: number, female: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map((data) => {
                let maleCount = 0;
                let femaleCount = 0;
                const seen = new Set<string>();

                for (const row of data) {
                    const name = row['Profile.Name']?.trim();
                    const rawNationality = row['Profile.Nationality']?.trim();
                    const gender = row['Profile.Gender']?.trim().toLowerCase();

                    if (!name || !rawNationality || !gender) continue;

                    // Use the new nationality processing helper
                    const nationalities = this.processNationality(rawNationality);

                    // Skip duplicates for this astronaut-country pair
                    for (const nat of nationalities) {
                        const key = `${name}__${nat}`;
                        if (nat === country && !seen.has(key)) {
                            seen.add(key);
                            if (gender === 'male') {
                                maleCount++;
                            } else if (gender === 'female') {
                                femaleCount++;
                            }
                        }
                    }
                }

                return { male: maleCount, female: femaleCount };
            })
        );
    }
    getGenderDistribution(): Observable<{ male: number, female: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map((data) => {
                const seen = new Set<string>();
                let maleCount = 0;
                let femaleCount = 0;

                for (const row of data) {
                    const name = row['Profile.Name']?.trim();
                    const rawNationality = row['Profile.Nationality']?.trim();
                    const gender = row['Profile.Gender']?.trim().toLowerCase();

                    if (!name || !rawNationality || !gender) continue;

                    // Skip duplicates
                    if (seen.has(name)) continue;
                    seen.add(name);

                    if (gender === 'male') {
                        maleCount++;
                    } else if (gender === 'female') {
                        femaleCount++;
                    }
                }

                return { male: maleCount, female: femaleCount };
            })
        );
    }
    getGenderDistributionByRange(range: string): Observable<{ male: number, female: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map((data) => {
                const seen = new Set<string>();
                let maleCount = 0;
                let femaleCount = 0;

                for (const row of data) {
                    const name = row['Profile.Name']?.trim();
                    const rawNationality = row['Profile.Nationality']?.trim();
                    const gender = row['Profile.Gender']?.trim().toLowerCase();

                    if (!name || !rawNationality || !gender) continue;

                    // Skip duplicates - only count each astronaut once
                    if (seen.has(name)) continue;
                    seen.add(name);

                    // Use the new nationality processing helper
                    const nationalities = this.processNationality(rawNationality);

                    // Check if any of the astronaut's nationalities have counts in the specified range
                    let inRange = false;
                    for (const nationality of nationalities) {
                        const countryCount = this.getCountryAstronautCount(data, nationality);
                        if (this.isCountInRange(countryCount, range)) {
                            inRange = true;
                            break;
                        }
                    }

                    if (inRange) {
                        if (gender === 'male') {
                            maleCount++;
                        } else if (gender === 'female') {
                            femaleCount++;
                        }
                    }
                }

                return { male: maleCount, female: femaleCount };
            })
        );
    }

    private getCountryAstronautCount(data: any[], targetCountry: string): number {
        const seen = new Set<string>();
        let count = 0;

        for (const row of data) {
            const name = row['Profile.Name']?.trim();
            const rawNationality = row['Profile.Nationality']?.trim();

            if (!name || !rawNationality) continue;

            // Use the new nationality processing helper
            const nationalities = this.processNationality(rawNationality);

            for (const nationality of nationalities) {
                const key = `${name}__${nationality}`;
                if (!seen.has(key) && nationality === targetCountry) {
                    seen.add(key);
                    count++;
                }
            }
        }

        return count;
    }

    public isCountInRange(count: number, range: string): boolean {
        switch (range) {
            case '300+': return count > 300;
            case '100-299': return count > 100 && count <= 300;
            case '50-99': return count > 50 && count <= 100;
            case '20-49': return count > 20 && count <= 50;
            case '10-19': return count > 10 && count <= 20;
            case '1-9': return count > 0 && count <= 10;
            case '0': return count === 0;
            default: return false;
        }
    }

    getCollaboratingCountries(selectedCountry?: string): Observable<{ [country: string]: number }> {
        return this.http.get<any[]>('assets/astronauts.flat.json').pipe(
            map(data => {
                const missionToCountries = new Map<string, Set<string>>();

                // Map each mission to its set of countries
                for (const row of data) {
                    const rawNationality = row['Profile.Nationality']?.trim();
                    const missionName = row['Mission.Name'];
                    const mission = typeof missionName === 'string' ? missionName.trim() : missionName;

                    if (!mission || !rawNationality) continue;

                    // Use the new nationality processing helper
                    const nationalities = this.processNationality(rawNationality);

                    if (!missionToCountries.has(mission)) {
                        missionToCountries.set(mission, new Set());
                    }

                    for (const nationality of nationalities) {
                        missionToCountries.get(mission)!.add(nationality);
                    }
                }

                const collaborations: { [country: string]: number } = {};

                for (const countries of missionToCountries.values()) {
                    const arr = Array.from(countries);
                    for (let i = 0; i < arr.length; i++) {
                        for (let j = 0; j < arr.length; j++) {
                            if (i !== j) {
                                const a = arr[i];
                                const b = arr[j];
                                if (!selectedCountry || a === selectedCountry) {
                                    collaborations[b] = (collaborations[b] || 0) + 1;
                                }
                            }
                        }
                    }
                }

                return collaborations;
            })
        );
    }
}
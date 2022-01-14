import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import PlaceResult = google.maps.places.PlaceResult;
import FindPlaceFromQueryRequest = google.maps.places.FindPlaceFromQueryRequest;
import PlacesServiceStatus = google.maps.places.PlacesServiceStatus;
import {GoogleMap} from '@angular/google-maps';
import PlacesService = google.maps.places.PlacesService;
import PlaceDetailsRequest = google.maps.places.PlaceDetailsRequest;
import PlaceSearchRequest = google.maps.places.PlaceSearchRequest;
import PlaceSearchPagination = google.maps.places.PlaceSearchPagination;

@Injectable({
  providedIn: 'root'
})
export class GooglePlacesService {
  map!: GoogleMap;
  placesService!: PlacesService;
  constructor() { }

  setMap = (map: GoogleMap) => {
    this.map = map;
    if (this.map?.googleMap) {
      this.placesService = new PlacesService(this.map.googleMap);
    }
  }

  findPlaceNearBy = (request: PlaceSearchRequest): Observable<{results: PlaceResult[], status: PlacesServiceStatus, pagination: PlaceSearchPagination}|null> => {
    return new Observable((observer) => {
      this.placesService.nearbySearch(request,(results: PlaceResult[], status: PlacesServiceStatus, pagination: PlaceSearchPagination) => {
        console.log(results, status);
        if (status === PlacesServiceStatus.OK) {
          return observer.next({results, status, pagination});
        }
      });
    })
  }

  findPlaceFromQuery = (request: FindPlaceFromQueryRequest): Observable<{results: PlaceResult[], status: PlacesServiceStatus}|null> => {
    return new Observable<{results: PlaceResult[], status: PlacesServiceStatus}>((observer) => {
      this.placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === PlacesServiceStatus.OK) {
          return observer.next({results, status});
        }
        return observer.error();
      });
      return {
        unsubscribe() {}
      }
    });
  }

  getDetails = (request: PlaceDetailsRequest) => {
    return new Observable<{result: PlaceResult, status: PlacesServiceStatus}>((observer) => {
      this.placesService.getDetails(request, (result, status) => {
        if (status === PlacesServiceStatus.OK) {
          return observer.next({result, status});
        }
        return observer.error();
      })
      return {
        unsubscribe() {}
      }
    });
  }
}

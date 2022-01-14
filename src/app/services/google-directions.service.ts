import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import DirectionsService = google.maps.DirectionsService;
import DirectionsResult = google.maps.DirectionsResult;
import DirectionsStatus = google.maps.DirectionsStatus;
import DirectionsRequest = google.maps.DirectionsRequest;

@Injectable({
  providedIn: 'root'
})
export class GoogleDirectionsService {
  private directionService = new DirectionsService();
  constructor() { }

  getDirections = (request: DirectionsRequest) => {
    return new Observable<{result: DirectionsResult, status: DirectionsStatus}>((observer) => {
      this.directionService.route(request, (result, status) => {
        if (status === DirectionsStatus.OK) {
          return observer.next({result, status});
        }
        return observer.error(result);
      })
    })
  }
}

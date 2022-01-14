import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {GoogleMap} from '@angular/google-maps';
import {GooglePlacesService} from './services/google-places.service';
import {GoogleDirectionsService} from './services/google-directions.service';
import LatLng = google.maps.LatLng;
import TravelMode = google.maps.TravelMode;
import Marker = google.maps.Marker;
import DirectionsRenderer = google.maps.DirectionsRenderer;
import {FormControl, FormGroup, Validators} from '@angular/forms';
import MapMouseEvent = google.maps.MapMouseEvent;
import DirectionsResult = google.maps.DirectionsResult;
import {ToastrService} from 'ngx-toastr';
import PolylineOptions = google.maps.PolylineOptions;

const deg2rad = (deg: number) => deg * (Math.PI/180);
const getDistance = (origin: LatLng, destination: LatLng) => {
  const R = 6371000; // metres
  const a1 = deg2rad(origin.lat());
  const a2 = deg2rad(destination.lat());
  const da1 = deg2rad(destination.lat() - origin.lat());
  const da2 = deg2rad(destination.lng() - origin.lng());

  const a = Math.sin(da1/2) * Math.sin(da1/2) +
    Math.cos(a1) * Math.cos(a2) *
    Math.sin(da2/2) * Math.sin(da2/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export interface GoodType {
  id: number;
  name: string;
}
export interface Commodity {
  id: number;
  name: string;
}
export interface GoodPackageType {
  id: number;
  name: string;
}
export interface VehicleCoordinate {
  order_id: number|null;
  vehicle_id: number;
  latitude: number;
  longitude: number;
  is_origin: boolean;
  is_destination: boolean;
  waiting_time: number;
  arrival_time: string|null;
  status: number;

  order: Order;
  vehicle: Vehicle;
}

export interface Vehicle {
  id: number;
  company_id: number;
  nickname: string;
  vehicle_type_id: number;
  fuel_type_id: number;
  latitude: number;
  longitude: number;
  weight_capacity: number;
  volume_capacity: number;
  vehicle_coordinates: VehicleCoordinate[];
}

export interface Good {
  name: string;
  weight: number;
  volume: number;
  good_type_id: number;
  commodity_id: number;
  good_package_type_id: number;
}

export interface City {
  name: string;
}

export interface Address {
  street: string;
  house_number: string;
  phone: string;
  city_id: number;
  longitude: string;
  latitude: string;
  city: City;
}

export interface Order {
  pickup_address_id: number;
  delivery_address_id: number;
  vehicle_id: number;
  pickup_time: string;
  delivery_time: string;
  polyline: string;
  goods: Good[];
  pickup_address: Address;
  delivery_address: Address;
  vehicle: Vehicle;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Use-case';
  center: google.maps.LatLngLiteral = {lat: 41.8873704224784, lng: 12.499916578027346};
  zoom = 12;
  cars: Vehicle[] = [];
  carsForOrder: Vehicle[] = [];
  markers: Marker[] = [];
  directionResult?: DirectionsResult;
  directionRenderer!: DirectionsRenderer;
  polylineOptions?: PolylineOptions;
  get order(): Partial<Order>|any {
    return {
      ...this.orderForm.value,
      origin: {
        ...this.orderForm.controls.origin.value,
        lat: this.orderForm.controls.origin.value.lat,
        lng: this.orderForm.controls.origin.value.lng
      },
      destination: {
        ...this.orderForm.controls.destination.value,
        lat: this.orderForm.controls.destination.value.lat,
        lng: this.orderForm.controls.destination.value.lng
      },
      goods: this.orderForm.value.goods.map((g: FormGroup) => g.value),
      polygon: this.directionResult?.routes?.length ? this.directionResult.routes[0].overview_polyline : []
    };
  }
  get emptyGood(): FormGroup {
    if (this.goodData) {
      return new FormGroup({
        name: new FormControl(`good #${this.orderForm.value.goods.length + 1}`),
        weight: new FormControl(Math.round(Math.random() * 20)),
        volume: new FormControl(Math.round(Math.random() * 70)),
        good_type_id: new FormControl(this.goodData.good_types[Math.floor(Math.random() * (this.goodData.good_types.length))].id),
        commodity_id: new FormControl(this.goodData.commodities[Math.floor(Math.random() * (this.goodData.commodities.length))].id),
        good_package_type_id: new FormControl(this.goodData.good_package_types[Math.floor(Math.random() * (this.goodData.good_package_types.length))].id)
      });
    }
    return new FormGroup( {
      name: new FormControl(''),
      weight: new FormControl(0),
      volume: new FormControl(0),
      good_type_id: new FormControl(0),
      commodity_id: new FormControl(0),
      good_package_type_id: new FormControl(0)
    });
  }
  goodData: {
    good_types: GoodType[],
    commodities: Commodity[],
    good_package_types: GoodPackageType[]
  } = {
    good_types: [],
    good_package_types: [],
    commodities: []
  }
  get isOriginSet(): boolean {
    return (this.orderForm.controls.origin as FormGroup).controls.lat.value && (this.orderForm.controls.origin as FormGroup).controls.lng.value;
  }
  get isDestinationSet(): boolean {
    return (this.orderForm.controls.destination as FormGroup).controls.lat.value && (this.orderForm.controls.destination as FormGroup).controls.lng.value;
  }
  get originCoordinates(): LatLng  {
    return new LatLng(
      (this.orderForm.controls.origin as FormGroup).controls.lat.value,
      (this.orderForm.controls.origin as FormGroup).controls.lng.value
    )
  }
  get destinationCoordinates(): LatLng  {
    return new LatLng(
      (this.orderForm.controls.destination as FormGroup).controls.lat.value,
      (this.orderForm.controls.destination as FormGroup).controls.lng.value
    )
  }
  @ViewChild('map') map!: GoogleMap;

  orderForm = new FormGroup({
    origin: new FormGroup({
      street: new FormControl('pignetto', [Validators.required]),
      house_number: new FormControl('1', [Validators.required]),
      phone: new FormControl(''),
      lat: new FormControl(0),
      lng: new FormControl(0)
    }),
    destination: new FormGroup({
      street: new FormControl('via grigorio XI', [Validators.required]),
      house_number: new FormControl('1', [Validators.required]),
      phone: new FormControl(''),
      lat: new FormControl(0),
      lng: new FormControl(0)
    }),
    goods: new FormControl([], [Validators.minLength(1)])
  });
  constructor(
    private httpClient: HttpClient,
    private placesService: GooglePlacesService,
    private directionService: GoogleDirectionsService,
    private toast: ToastrService
  ) {}

  addGood = () => {
    this.orderForm.controls.goods.setValue([...this.orderForm.controls.goods.value, this.emptyGood]);
  }

  removeGood = (good: Good) => {
    const goods = this.orderForm.controls.goods.value;
    goods.splice(goods.findIndex((g: Good) => g === good), 1);
    this.orderForm.controls.goods.setValue(goods);
  }

  subscriberCoordinatesForms = (value: {lat: number; lng: number; }) => {

  }

  delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  private _func = (vehicle: Vehicle, newOrderOrigin: LatLng, newOrderDestination: LatLng): google.maps.DirectionsRequest => {
    const vehCurrentCoordinates = new LatLng({
      lat: vehicle.latitude,
      lng: vehicle.longitude
    });
    if (vehicle.vehicle_coordinates.length) {
      const nextCarSensitivePointVehicleCoordinates = vehicle.vehicle_coordinates.filter(v => v.status === 0 && (v.is_origin || v.is_destination));
      const pathArray: VehicleCoordinate[] = [];
      const points: {vehicle_coordinate: Partial<VehicleCoordinate>}[] = nextCarSensitivePointVehicleCoordinates.map(v => ({
        vehicle_coordinate: v
      }));
      points.push({
        vehicle_coordinate: {
          vehicle_id: vehicle.id,
          is_origin: true,
          status: 0,
          order_id: 0,
          latitude: newOrderOrigin.lat(),
          longitude: newOrderOrigin.lng()
        }
      });
      points.push({
        vehicle_coordinate: {
          vehicle_id: vehicle.id,
          is_destination: true,
          status: 0,
          order_id: 0,
          latitude: newOrderDestination.lat(),
          longitude: newOrderDestination.lng()
        }
      });
      const passedPoints = points.filter(p => p.vehicle_coordinate.status === 1);
      const pointsToBePassed = points.filter(p => p.vehicle_coordinate.status === 0);
      while (pointsToBePassed.length > 0) {
        let closestPoint = vehicle.vehicle_coordinates[0];
        let closestFlagPoint: VehicleCoordinate = vehicle.vehicle_coordinates[0];
        let minimDistance = Infinity;
        let newClosestPointIndex = 0;
        pointsToBePassed.forEach((p, i) => {
          const closestPointCoordinates = new LatLng({
            lat: closestFlagPoint.latitude,
            lng: closestFlagPoint.longitude
          });
          const pointCoordinates = new LatLng({
            lat: p.vehicle_coordinate.latitude as number,
            lng: p.vehicle_coordinate.longitude as number
          });
          const distance = getDistance(closestPointCoordinates, pointCoordinates);
          if (distance < minimDistance) {
            if (p.vehicle_coordinate.is_destination) {
              console.group('Destination found');
              console.log('Point ', p.vehicle_coordinate, 'is destination');
              console.log('Order id is ', p.vehicle_coordinate.order_id);
              console.log('Point in passed with same order_id which is origin ', [...passedPoints].find(p1 => p1.vehicle_coordinate.order_id === p.vehicle_coordinate.order_id && p1.vehicle_coordinate.is_origin));
              console.log('In new array point with same order_id and is origin ', [...pathArray].find(p1 => p1.is_origin && p1.order_id === p.vehicle_coordinate.order_id));
              console.groupEnd();
            }
            if (
              p.vehicle_coordinate.is_destination &&
              p.vehicle_coordinate.order_id !== undefined &&
              !passedPoints.find(p1 => p1.vehicle_coordinate.order_id === p.vehicle_coordinate.order_id && p1.vehicle_coordinate.is_origin) &&
              !pathArray.find(p2 => p2.is_origin && p2.order_id === p.vehicle_coordinate.order_id)
            ) {
              return ;
            }
            minimDistance = distance;
            closestFlagPoint = p.vehicle_coordinate as VehicleCoordinate;
            newClosestPointIndex = i;
          }
        });
        closestPoint = closestFlagPoint as unknown as VehicleCoordinate;
        const elToPasteInMainArray: {vehicle_coordinate: Partial<VehicleCoordinate>}[] = pointsToBePassed.splice(newClosestPointIndex, 1);
        if (elToPasteInMainArray.length > 0) {
          pathArray.push(elToPasteInMainArray[0].vehicle_coordinate as VehicleCoordinate);
        }
      }
      console.log(pathArray);
      const lastVC = pathArray[pathArray.length - 1] as VehicleCoordinate;
      pathArray.splice(-1, 1);
      return {
        origin: {
          location: vehCurrentCoordinates
        },
        destination: {
          location: new LatLng({lat: lastVC.latitude, lng: lastVC.longitude})
        },
        waypoints: pathArray.map(d => ({
          location: new LatLng({lat: d.latitude as number, lng: d.longitude as number}),
        })),
        travelMode: TravelMode.DRIVING
      }
    }
    return {
      origin: {
        location: vehCurrentCoordinates
      },
      destination: {
        location: newOrderDestination
      },
      waypoints: [
        {
          location: newOrderOrigin
        }
      ],
      travelMode: TravelMode.DRIVING
    };
  }

  find = (type: 'origin'|'destination') => {
    const formGroup: FormGroup = this.orderForm.controls[type] as FormGroup;
    const query = `Roma, ${formGroup.value.street}, ${formGroup.value.house_number}`
    this.placesService.findPlaceFromQuery({query, fields: ['place_id']})
      .subscribe((e) => {
        if (e && e.results.length && e.results[0].place_id) {
          this.placesService.getDetails({placeId: e.results[0].place_id}).subscribe((r) => {
            if (r.result) {
              formGroup.controls.lat.setValue(r.result.geometry?.location.lat());
              formGroup.controls.lng.setValue(r.result.geometry?.location.lng());
            }
            if (this.isOriginSet && this.isDestinationSet) {
              this.directionService.getDirections({
                origin: this.originCoordinates,
                destination: this.destinationCoordinates,
                travelMode: TravelMode.DRIVING
              }).subscribe(r => {
                this.directionResult = r.result;
                this.directionRenderer.setDirections(r.result);
                this.httpClient.post(`http://localhost:8000/api/orders/get-car-for-order`, this.order, {responseType: 'json'})
                  .subscribe((response) => {
                    const vehicle = (response as any).data as Vehicle;
                    const newOrderOrigin = new LatLng(this.order.origin.lat, this.order.origin.lng);
                    const newOrderDestination = new LatLng(this.order.destination.lat, this.order.destination.lng);
                    const request = this._func(vehicle, newOrderOrigin, newOrderDestination);
                    console.log(request);
                    this.directionService.getDirections(request).subscribe(r => {
                      this.directionResult = r.result;
                      this.directionRenderer.setDirections(r.result);
                    });
                  });
              });
            } else {
              this.directionResult = undefined;
            }
          });
        }
      });
  }

  zoomChanged = () => {}

  ngOnInit(): void {
    this.httpClient.get(`http://localhost:8000/api/good-data`, {responseType: 'json'})
      .subscribe((response) => {
        this.goodData = (response as {data: {good_types: GoodType[], good_package_types: GoodPackageType[], commodities: Commodity[]}}).data;
        this.orderForm.controls.goods.setValue([this.emptyGood]);
      });
    this.httpClient.get(`http://localhost:8000/api/cars`)
      .subscribe((response: any) => {
        this.cars = response.data;
        this.resetMarkers();
      });
  }

  ngAfterViewInit(): void {
    this.placesService.setMap(this.map);
    this.directionRenderer = new DirectionsRenderer({map: this.map.googleMap});
  }



  mapDoubleClick = (e: MapMouseEvent) => {

  }

  createOrder = () => {
    this.httpClient.post(`http://localhost:8000/api/orders/create`, this.order, {responseType: 'json'})
      .subscribe((res: any) => {
        if (res.success) {
          this.carsForOrder = res.data;
        } else {
          this.toast.error('No cars available for the order!', 'WARNING!');
        }
      })
  }


  coordinates = () => {}



  clickButton = () => {
    if (this.isOriginSet) {
      this.find('destination');
    }
  }

  getMarkerFromVehicle = (v: Vehicle): Marker => {
    const marker = new Marker({
      icon: {
        url: "../assets/icons/car.png",
        size: new google.maps.Size(20, 18),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 0),
      },
      draggable: false,
      map: this.map.googleMap,
      clickable: true
    });
    marker.setPosition(new LatLng(v.latitude, v.longitude));
    (marker as any).vehicle = v;
    marker.addListener('click', (e) => {
      this.polylineOptions = {
        strokeColor: '#ff0000',
        strokeOpacity: 1,
        path: v.vehicle_coordinates.map(vc => ({lat: vc.latitude, lng: vc.longitude}))
      }
    })
    return marker;
  }

  resetMarkers = () => {
    this.markers.forEach(m => m.setMap(null));
    this.markers = this.cars.map(this.getMarkerFromVehicle);
  }
}

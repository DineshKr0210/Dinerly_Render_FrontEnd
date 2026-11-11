import {
  CdkDragEnd
} from '@angular/cdk/drag-drop';

import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';

import {
  Subscription,
  forkJoin
} from 'rxjs';

import {
  addTabletoRestaurantRequest,
  mergerTableRequest,
  RestaurantFloorServer,
  RestaurantStaffMember,
  TableServerAssignment,
  tableList,
  unMergerTableRequest
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import {
  WaitlistApiRestaurantService
} from 'src/app/services/waitlist-api-restaurant.service';

import {
  WaitlistAuthService
} from 'src/app/services/waitlist-auth.service';

import {
  ToastService
} from 'src/app/services/toast.service';

import {
  WaitlistRestaurantModalService
} from 'src/app/services/waitlist-restaurant-modal.service';


type TableMode =
  | 'LIVE'
  | 'MERGE'
  | 'UNMERGE'
  | 'EDIT';


type FixtureType =
  | 'WALL'
  | 'BAR'
  | 'HOST';


interface FloorTable extends tableList {
  x?: number;
  y?: number;
  rotation?: number;
  customName?: string;
  server?: string;
  mergedTableId?: number | null;
}


interface FloorFixture {
  id: number;
  type: FixtureType;
  label: string;
  x: number;
  y: number;
  rotation: number;
}


@Component({
  selector: 'app-waitlist-tables',
  templateUrl:
    './waitlist-tables.component.html',
  styleUrls: [
    './waitlist-tables.component.css'
  ]
})
export class WaitlistTablesComponent
  implements OnInit, OnDestroy {

  tables: FloorTable[] = [];

  fixtures: FloorFixture[] = [];

  restaurantId = 0;

  restaurantName = '';

  showRestaurantMenu = false
  isLoading = false;

  isMerging = false;

  isUnmerging = false;

  activeMode: TableMode = 'LIVE';

  selectedTable:
    FloorTable | null = null;

  selectedTableIds: number[] = [];

  serverAssignmentMode = '';

  floorServers: RestaurantFloorServer[] = [];

  staffMembers: RestaurantStaffMember[] = [];

  tableAssignments: TableServerAssignment[] = [];

  pendingServerByTable:
    Record<number, number | null> = {};

  isFloorPanelOpen = false;

  isFloorLoading = false;

  isStartingShift = false;

  isAssigningTable = false;

  floorBusyStaffIds: number[] = [];

  private readonly sub =
    new Subscription();


  constructor(
    private waitlistService:
      WaitlistApiRestaurantService,

    private authService:
      WaitlistAuthService,

    public modalService:
      WaitlistRestaurantModalService,
      private router: Router,
    private toastService: ToastService
  ) { }


  ngOnInit(): void {

    this.restaurantId =
      this.authService
        .getRestaurantId();

    this.restaurantName =
      this.authService
        .getRestaurantName();

    if (!this.restaurantId) {

      alert(
        'Restaurant information is missing. Please log in again.'
      );

      this.authService
        .signOutRestaurant();

      return;
    }

    this.getRestaurantTables();

    this.loadFloorData();
  }


  /* =====================================================
     COUNTS
  ====================================================== */

  get openCount(): number {

    return this.tables.filter(
      table =>
        table.status === 'OPEN'
    ).length;
  }


  get seatedCount(): number {

    return this.tables.filter(
      table =>
        table.status === 'OCCUPIED'
    ).length;
  }


  get reservedCount(): number {

    return this.tables.filter(
      table =>
        table.status === 'RESERVED'
    ).length;
  }


  get cleaningCount(): number {

    return this.tables.filter(
      table =>
        table.status === 'NEEDS_CLEANING'
    ).length;
  }


  get openProgress(): number {

    if (!this.tables.length) {
      return 0;
    }

    return (
      this.openCount /
      this.tables.length
    ) * 100;
  }


  get restaurantInitial(): string {

    const name =
      this.restaurantName.trim();

    if (!name) {
      return 'R';
    }

    return name
      .charAt(0)
      .toUpperCase();
  }


  


  /* =====================================================
     GET TABLES
  ====================================================== */

  getRestaurantTables(): void {

    if (!this.restaurantId) {
      return;
    }

    this.isLoading = true;

    const request =
      this.waitlistService
        .getRestaurantTableslist(
          this.restaurantId
        )
        .subscribe({
          next: response => {

            this.isLoading = false;

            const apiTables:
              tableList[] =
              response?.data || [];

            this.tables =
              apiTables.map(
                (
                  table,
                  index
                ): FloorTable => {

                  const existingTable =
                    this.tables.find(
                      currentTable =>
                        currentTable.id ===
                        table.id
                    );

                  return {
                    ...table,

                    x:
                      existingTable?.x ??
                      this.getDefaultX(
                        index
                      ),

                    y:
                      existingTable?.y ??
                      this.getDefaultY(
                        index
                      ),

                    rotation:
                      existingTable
                        ?.rotation ??
                      0,

                    customName:
                      existingTable
                        ?.customName,

                    mergedTableId:
                      table
                        .mergedTableId ??
                      null
                  };
                }
              );

            this.applyServerNames();

            this.selectedTable =
              null;

            this.selectedTableIds =
              [];
          },

          error: error => {

            this.isLoading = false;

            console.error(
              'Unable to load tables:',
              error
            );

            alert(
              error?.error?.message ||
              'Unable to load the tables'
            );
          }
        });

    this.sub.add(request);
  }


  reloadTableList(): void {

    this.getRestaurantTables();
  }


  /* =====================================================
     MODES
  ====================================================== */

  setMode(
    mode: TableMode
  ): void {

    if (
      this.isMerging ||
      this.isUnmerging
    ) {
      return;
    }

    if (
      this.activeMode === mode
    ) {
      this.cancelMode();

      return;
    }

    this.activeMode = mode;

    this.selectedTableIds = [];

    this.selectedTable = null;
  }


  toggleEditMode(): void {

    if (
      this.isMerging ||
      this.isUnmerging
    ) {
      return;
    }

    this.activeMode =
      this.activeMode === 'EDIT'
        ? 'LIVE'
        : 'EDIT';

    this.selectedTableIds = [];

    this.selectedTable = null;
  }


  cancelMode(): void {

    if (
      this.isMerging ||
      this.isUnmerging
    ) {
      return;
    }

    this.activeMode = 'LIVE';

    this.selectedTableIds = [];

    this.selectedTable = null;
  }


  /* =====================================================
     TABLE SELECTION
  ====================================================== */

  onTableClick(
    table: FloorTable
  ): void {

    if (
      this.activeMode === 'MERGE'
    ) {
      this.selectForMerge(table);

      return;
    }

    if (
      this.activeMode === 'UNMERGE'
    ) {
      this.selectForUnmerge(
        table
      );

      return;
    }

    if (
      this.activeMode === 'EDIT'
    ) {
      this.selectedTable =
        this.selectedTable?.id ===
        table.id
          ? null
          : table;

      return;
    }

    this.selectedTable =
      this.selectedTable?.id ===
      table.id
        ? null
        : table;
  }


  isSelected(
    tableId: number
  ): boolean {

    return this.selectedTableIds
      .includes(
        tableId
      );
  }


  isMerged(
    tableId: number
  ): boolean {

    const table =
      this.tables.find(
        item =>
          item.id === tableId
      );

    return (
      table?.mergedTableId !== null &&
      table?.mergedTableId !== undefined
    );
  }


  /* =====================================================
     MERGE TABLES
  ====================================================== */

  selectForMerge(
    table: FloorTable
  ): void {

    if (
      table.status !== 'OPEN'
    ) {
      alert(
        'Only open tables can be merged.'
      );

      return;
    }

    if (
      this.isMerged(table.id)
    ) {
      alert(
        'This table is already merged. Unmerge it before merging again.'
      );

      return;
    }

    if (
      this.selectedTableIds
        .includes(
          table.id
        )
    ) {
      this.selectedTableIds =
        this.selectedTableIds
          .filter(
            id =>
              id !== table.id
          );

      return;
    }

    if (
      this.selectedTableIds
        .length >= 2
    ) {
      alert(
        'You can merge only two tables at a time.'
      );

      return;
    }

    this.selectedTableIds = [
      ...this.selectedTableIds,
      table.id
    ];
  }


  confirmMerge(): void {

    if (
      this.selectedTableIds
        .length !== 2
    ) {
      alert(
        'Please select exactly two open tables.'
      );

      return;
    }

    const [
      firstTableId,
      secondTableId
    ] = this.selectedTableIds;

    const firstTable =
      this.tables.find(
        table =>
          table.id ===
          firstTableId
      );

    const secondTable =
      this.tables.find(
        table =>
          table.id ===
          secondTableId
      );

    if (
      !firstTable ||
      !secondTable
    ) {
      alert(
        'Selected table information is missing.'
      );

      return;
    }

    if (
      firstTable.status !== 'OPEN' ||
      secondTable.status !== 'OPEN'
    ) {
      alert(
        'Both tables must be open before merging.'
      );

      return;
    }

    if (
      this.isMerged(
        firstTable.id
      ) ||
      this.isMerged(
        secondTable.id
      )
    ) {
      alert(
        'One of the selected tables is already merged.'
      );

      return;
    }

    const payload:
      mergerTableRequest = {

      tableId:
        firstTable.id,

      mergedTableId:
        secondTable.id
    };

    this.isMerging = true;

    this.isLoading = true;

    const request =
      this.waitlistService
        .mergeTables(
          this.restaurantId,
          payload
        )
        .subscribe({
          next: response => {

            this.isMerging =
              false;

            this.isLoading =
              false;

            if (
              response?.success ===
              false
            ) {
              alert(
                response?.message ||
                'Unable to merge tables'
              );

              return;
            }

            this.activeMode =
              'LIVE';

            this.selectedTableIds =
              [];

            this.selectedTable =
              null;

            alert(
              response?.message ||
              `${firstTable.tableNumber} and ${secondTable.tableNumber} merged successfully`
            );

            this.getRestaurantTables();
          },

          error: error => {

            this.isMerging =
              false;

            this.isLoading =
              false;

            console.error(
              'Merge tables error:',
              error
            );

            alert(
              error?.error?.message ||
              error?.message ||
              'Unable to merge tables'
            );
          }
        });

    this.sub.add(request);
  }


  /* =====================================================
     UNMERGE TABLES
  ====================================================== */

  selectForUnmerge(
    table: FloorTable
  ): void {

    if (
      !this.isMerged(table.id)
    ) {
      alert(
        'Select a table that is currently merged.'
      );

      return;
    }

    if (
      this.selectedTableIds
        .includes(
          table.id
        )
    ) {
      this.selectedTableIds =
        this.selectedTableIds
          .filter(
            id =>
              id !== table.id
          );

      return;
    }

    if (
      this.selectedTableIds
        .length >= 2
    ) {
      alert(
        'You can unmerge only two tables at a time.'
      );

      return;
    }

    this.selectedTableIds = [
      ...this.selectedTableIds,
      table.id
    ];
  }


  confirmUnmerge(): void {

    if (
      this.selectedTableIds
        .length !== 2
    ) {
      alert(
        'Please select exactly two merged tables.'
      );

      return;
    }

    const [
      firstTableId,
      secondTableId
    ] = this.selectedTableIds;

    const firstTable =
      this.tables.find(
        table =>
          table.id ===
          firstTableId
      );

    const secondTable =
      this.tables.find(
        table =>
          table.id ===
          secondTableId
      );

    if (
      !firstTable ||
      !secondTable
    ) {
      alert(
        'Selected table information is missing.'
      );

      return;
    }

    if (
      !this.isMerged(
        firstTable.id
      ) ||
      !this.isMerged(
        secondTable.id
      )
    ) {
      alert(
        'Both selected tables must currently be merged.'
      );

      return;
    }

    const payload:
      unMergerTableRequest = {

      tableId:
        firstTable.id,

      mergedTableId:
        secondTable.id
    };

    this.isUnmerging = true;

    this.isLoading = true;

    const request =
      this.waitlistService
        .unmergeTables(
          this.restaurantId,
          payload
        )
        .subscribe({
          next: response => {

            this.isUnmerging =
              false;

            this.isLoading =
              false;

            if (
              response?.success ===
              false
            ) {
              alert(
                response?.message ||
                'Unable to unmerge tables'
              );

              return;
            }

            this.activeMode =
              'LIVE';

            this.selectedTableIds =
              [];

            this.selectedTable =
              null;

            alert(
              response?.message ||
              `${firstTable.tableNumber} and ${secondTable.tableNumber} unmerged successfully`
            );

            this.getRestaurantTables();
          },

          error: error => {

            this.isUnmerging =
              false;

            this.isLoading =
              false;

            console.error(
              'Unmerge tables error:',
              error
            );

            alert(
              error?.error?.message ||
              error?.message ||
              'Unable to unmerge tables'
            );
          }
        });

    this.sub.add(request);
  }


  /* =====================================================
     FLOOR SERVERS AND TABLE ASSIGNMENTS
  ====================================================== */

  get onFloorServers(): RestaurantFloorServer[] {

    return this.floorServers.filter(
      server => server.onFloor
    );
  }


  get offFloorStaff(): RestaurantStaffMember[] {

    const onFloorIds =
      new Set(
        this.onFloorServers.map(
          server => server.staffId
        )
      );

    return this.staffMembers.filter(
      staff =>
        staff.role === 'SERVER' &&
        !onFloorIds.has(staff.id)
    );
  }


  get isSectionMode(): boolean {

    return this.serverAssignmentMode === 'SECTION';
  }


  get sectionAssignmentGroups(): {
    serverId: number;
    serverName: string;
    tableNames: string[];
  }[] {

    if (!this.isSectionMode) {
      return [];
    }

    const groups = new Map<number, {
      serverId: number;
      serverName: string;
      tableNames: string[];
    }>();

    for (const assignment of this.tableAssignments) {

      if (!assignment.isActive) {
        continue;
      }

      const group =
        groups.get(assignment.assignedServerId) ||
        {
          serverId: assignment.assignedServerId,
          serverName: assignment.serverName,
          tableNames: []
        };

      group.tableNames.push(assignment.tableName);

      groups.set(assignment.assignedServerId, group);
    }

    return Array.from(groups.values());
  }


  trackByAssignmentServer(
    _index: number,
    group: { serverId: number }
  ): number {

    return group.serverId;
  }


  loadFloorData(): void {

    if (!this.restaurantId) {
      return;
    }

    this.isFloorLoading = true;

    this.sub.add(
      forkJoin({
        floor:
          this.waitlistService
            .getFloorServers(
              this.restaurantId
            ),

        staff:
          this.waitlistService
            .getRestaurantStaff(
              this.restaurantId
            ),

        assignments:
          this.waitlistService
            .getTableServerAssignments(
              this.restaurantId
            )
      }).subscribe({
        next: ({ floor, staff, assignments }) => {

          this.isFloorLoading = false;

          this.serverAssignmentMode =
            floor?.data?.serverAssignmentMode || '';

          this.floorServers =
            floor?.data?.servers || [];

          this.staffMembers =
            staff?.data || [];

          this.tableAssignments =
            assignments?.data || [];

          this.applyServerNames();
        },

        error: error => {

          this.isFloorLoading = false;

          console.error(
            'Unable to load floor servers:',
            error
          );

          this.toastService.error(
            error?.error?.message ||
            'Unable to load floor servers'
          );
        }
      })
    );
  }


  applyServerNames(): void {

    const serverByTableId =
      new Map<number, string>();

    const serverByTableNumber =
      new Map<string, string>();

    for (const server of this.onFloorServers) {

      (server.currentTableIds || [])
        .forEach(tableId =>
          serverByTableId.set(
            tableId,
            server.name
          )
        );

      (server.assignedTableNames || [])
        .forEach(tableName =>
          serverByTableNumber.set(
            tableName,
            server.name
          )
        );
    }

    this.tables.forEach(table => {

      table.server =
        serverByTableId.get(table.id) ||
        serverByTableNumber.get(
          String(table.tableNumber)
        );
    });
  }


  toggleFloorPanel(): void {

    this.isFloorPanelOpen =
      !this.isFloorPanelOpen;

    if (this.isFloorPanelOpen) {

      this.loadFloorData();
    }
  }


  closeFloorPanel(): void {

    this.isFloorPanelOpen = false;
  }


  isFloorBusy(staffId: number): boolean {

    return this.floorBusyStaffIds
      .includes(staffId);
  }


  trackByStaffId(
    index: number,
    item: { id?: number; staffId?: number }
  ): number {

    return item.id ?? item.staffId ?? index;
  }


  setServerFloorStatus(
    staffId: number,
    onFloor: boolean
  ): void {

    if (this.isFloorBusy(staffId)) {
      return;
    }

    this.floorBusyStaffIds = [
      ...this.floorBusyStaffIds,
      staffId
    ];

    this.sub.add(
      this.waitlistService
        .setServerFloorStatus(
          this.restaurantId,
          staffId,
          { onFloor }
        )
        .subscribe({
          next: () => {

            this.floorBusyStaffIds =
              this.floorBusyStaffIds
                .filter(id => id !== staffId);

            this.toastService.success(
              onFloor
                ? 'Server added to floor'
                : 'Server removed from floor'
            );

            this.loadFloorData();
          },

          error: error => {

            this.floorBusyStaffIds =
              this.floorBusyStaffIds
                .filter(id => id !== staffId);

            console.error(
              'Unable to update floor server:',
              error
            );

            this.toastService.error(
              error?.error?.message ||
              'Unable to update the floor server'
            );
          }
        })
    );
  }


  startShift(): void {

    if (this.isStartingShift) {
      return;
    }

    if (
      !confirm(
        'Start a new server shift for this restaurant?'
      )
    ) {
      return;
    }

    this.isStartingShift = true;

    this.sub.add(
      this.waitlistService
        .startServerShift(
          this.restaurantId
        )
        .subscribe({
          next: () => {

            this.isStartingShift = false;

            this.toastService.success(
              'Shift started'
            );

            this.loadFloorData();
          },

          error: error => {

            this.isStartingShift = false;

            console.error(
              'Unable to start shift:',
              error
            );

            this.toastService.error(
              error?.error?.message ||
              'Unable to start the shift'
            );
          }
        })
    );
  }


  getPendingServer(
    table: FloorTable
  ): number | null {

    const pending =
      this.pendingServerByTable[
        table.id
      ];

    if (pending !== undefined) {
      return pending;
    }

    return this.getActiveAssignment(table)
      ?.assignedServerId ?? null;
  }


  canAssignTable(
    table: FloorTable
  ): boolean {

    const serverId =
      this.getPendingServer(table);

    return (
      this.isSectionMode &&
      !!serverId &&
      !this.isAssigningTable &&
      serverId !==
        this.getActiveAssignment(table)
          ?.assignedServerId
    );
  }


  setPendingServer(
    table: FloorTable,
    serverId: number | null
  ): void {

    this.pendingServerByTable[
      table.id
    ] = serverId;
  }


  getActiveAssignment(
    table: FloorTable
  ): TableServerAssignment | undefined {

    return this.tableAssignments.find(
      assignment =>
        assignment.tableId ===
          table.id &&
        assignment.isActive
    );
  }


  assignTableServer(
    table: FloorTable
  ): void {

    const serverId =
      this.getPendingServer(table);

    if (
      !this.isSectionMode ||
      !serverId ||
      this.isAssigningTable
    ) {
      return;
    }

    this.isAssigningTable = true;

    this.sub.add(
      this.waitlistService
        .assignServer(
          this.restaurantId,
          table.id,
          { serverId }
        )
        .subscribe({
          next: () => {

            this.isAssigningTable = false;

            delete this.pendingServerByTable[
              table.id
            ];

            this.toastService.success(
              'Server assigned to table'
            );

            this.loadFloorData();
          },

          error: error => {

            this.isAssigningTable = false;

            console.error(
              'Unable to assign server:',
              error
            );

            this.toastService.error(
              error?.error?.message ||
              'Unable to assign the server'
            );
          }
        })
    );
  }


  removeTableServer(
    table: FloorTable
  ): void {

    const assignment =
      this.getActiveAssignment(table);

    if (
      !this.isSectionMode ||
      !assignment ||
      this.isAssigningTable
    ) {
      return;
    }

    this.isAssigningTable = true;

    this.sub.add(
      this.waitlistService
        .removeTableServerAssignment(
          this.restaurantId,
          assignment.id
        )
        .subscribe({
          next: () => {

            this.isAssigningTable = false;

            this.toastService.success(
              'Server removed from table'
            );

            this.loadFloorData();
          },

          error: error => {

            this.isAssigningTable = false;

            console.error(
              'Unable to remove server:',
              error
            );

            this.toastService.error(
              error?.error?.message ||
              'Unable to remove the server'
            );
          }
        })
    );
  }



  /* =====================================================
     DRAG AND ROTATE
  ====================================================== */

  onDragEnd(
    event: CdkDragEnd,
    table: FloorTable
  ): void {

    if (
      table.status === 'OCCUPIED'
    ) {
      return;
    }

    const position =
      event.source
        .getFreeDragPosition();

    table.x =
      this.snap(
        position.x
      );

    table.y =
      this.snap(
        position.y
      );

    event.source
      .setFreeDragPosition({
        x: table.x,
        y: table.y
      });
  }


  onFixtureDragEnd(
    event: CdkDragEnd,
    fixture: FloorFixture
  ): void {

    const position =
      event.source
        .getFreeDragPosition();

    fixture.x =
      this.snap(
        position.x
      );

    fixture.y =
      this.snap(
        position.y
      );

    event.source
      .setFreeDragPosition({
        x: fixture.x,
        y: fixture.y
      });
  }


  snap(
    value: number
  ): number {

    const gridSize = 10;

    return Math.round(
      value /
      gridSize
    ) * gridSize;
  }


  rotateTable(
    table: FloorTable,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    table.rotation =
      (
        (
          table.rotation ||
          0
        ) + 90
      ) % 360;
  }


  rotateFixture(
    fixture: FloorFixture,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    fixture.rotation =
      (
        fixture.rotation +
        90
      ) % 360;
  }


  /* =====================================================
     ADD TABLE
  ====================================================== */

  getNextTableNumber(): string {

    const maximumNumber =
      this.tables
        .map(
          table => {

            const match =
              table.tableNumber
                ?.match(/\d+/);

            return match
              ? Number(match[0])
              : 0;
          }
        )
        .reduce(
          (
            maximum,
            current
          ) =>
            Math.max(
              maximum,
              current
            ),
          0
        );

    return `T${maximumNumber + 1}`;
  }


  addTable(
    capacity: number
  ): void {

    const payload:
      addTabletoRestaurantRequest = {

      tableNumber:
        this.getNextTableNumber(),

      capacity
    };

    this.isLoading = true;

    const request =
      this.waitlistService
        .addTabletoRestaurant(
          this.restaurantId,
          payload
        )
        .subscribe({
          next: response => {

            this.isLoading = false;

            if (
              response?.success ===
              false
            ) {
              alert(
                response?.message ||
                'Unable to add table'
              );

              return;
            }

            this.toastService.success('Table saved');

            this.getRestaurantTables();
          },

          error: error => {

            this.isLoading = false;

            alert(
              error?.error?.message ||
              'Unable to add table'
            );
          }
        });

    this.sub.add(request);
  }


  /* =====================================================
     TABLE STATUS
  ====================================================== */

  getStatusOptions(
    table: FloorTable
  ): {
    label: string;
    value: string;
  }[] {

    switch (table.status) {

      case 'OPEN':
        return [
          {
            label:
              'Reserve',

            value:
              'RESERVED'
          },
          {
            label:
              'Occupied',

            value:
              'OCCUPIED'
          }
        ];

      case 'OCCUPIED':
        return [
          {
            label:
              'Open',

            value:
              'OPEN'
          },
          {
            label:
              'Need Clean',

            value:
              'NEEDS_CLEANING'
          }
        ];

      case 'RESERVED':
        return [
          {
            label:
              'Open',

            value:
              'OPEN'
          },
          {
            label:
              'Occupied',

            value:
              'OCCUPIED'
          }
        ];

      case 'NEEDS_CLEANING':
        return [
          {
            label:
              'Open',

            value:
              'OPEN'
          },
          {
            label:
              'Occupied',

            value:
              'OCCUPIED'
          }
        ];

      default:
        return [];
    }
  }


  changeTableStatus(
    table: FloorTable,
    status: string
  ): void {

    this.isLoading = true;

    const request =
      this.waitlistService
        .updateTableStatus(
          this.restaurantId,
          table.id,
          status
        )
        .subscribe({
          next: response => {

            this.isLoading = false;

            if (
              response?.success ===
              false
            ) {
              alert(
                response?.message ||
                'Unable to update table status'
              );

              return;
            }

            const updatedStatus =
              response?.data?.status ||
              status;

            this.tables =
              this.tables.map(
                currentTable => {

                  if (
                    currentTable.id ===
                    table.id
                  ) {
                    return {
                      ...currentTable,

                      status:
                        updatedStatus
                    };
                  }

                  return currentTable;
                }
              );

            this.selectedTable =
              null;

            alert(
              response?.message ||
              'Table status updated successfully'
            );
          },

          error: error => {

            this.isLoading = false;

            alert(
              error?.error?.message ||
              'Unable to update table status'
            );
          }
        });

    this.sub.add(request);
  }


  /* =====================================================
     FIXTURES
  ====================================================== */

  addFixture(
    type: FixtureType
  ): void {

    this.fixtures.push({
      id:
        Date.now(),

      type,

      label:
        type === 'HOST'
          ? 'HOST STAND'
          : type,

      x:
        300,

      y:
        250,

      rotation:
        0
    });
  }


  /* =====================================================
     REMOVE TABLE
  ====================================================== */

  removeTable(
    table: FloorTable
  ): void {

    if (
      table.status === 'OCCUPIED'
    ) {
      alert(
        'Occupied table cannot be removed.'
      );

      return;
    }

    if (
      this.isMerged(table.id)
    ) {
      alert(
        'Unmerge this table before removing it.'
      );

      return;
    }

    /*
     * This currently removes the table only
     * from the frontend.
     *
     * Replace this with your delete-table API
     * when the backend endpoint is available.
     */
    this.tables =
      this.tables.filter(
        currentTable =>
          currentTable.id !==
          table.id
      );

    this.selectedTable = null;
  }


  /* =====================================================
     CHAIRS
  ====================================================== */

  getChairs(
    capacity: number
  ): {
    position: string;
    index: number;
    total: number;
  }[] {

    if (capacity === 2) {

      return [
        {
          position: 'top',
          index: 0,
          total: 1
        },
        {
          position: 'bottom',
          index: 0,
          total: 1
        }
      ];
    }

    if (capacity === 4) {

      return [
        {
          position: 'top',
          index: 0,
          total: 2
        },
        {
          position: 'top',
          index: 1,
          total: 2
        },
        {
          position: 'bottom',
          index: 0,
          total: 2
        },
        {
          position: 'bottom',
          index: 1,
          total: 2
        }
      ];
    }

    if (capacity === 6) {

      return [
        {
          position: 'top',
          index: 0,
          total: 3
        },
        {
          position: 'top',
          index: 1,
          total: 3
        },
        {
          position: 'top',
          index: 2,
          total: 3
        },
        {
          position: 'bottom',
          index: 0,
          total: 3
        },
        {
          position: 'bottom',
          index: 1,
          total: 3
        },
        {
          position: 'bottom',
          index: 2,
          total: 3
        }
      ];
    }

    if (capacity === 8) {

      return [
        {
          position: 'top',
          index: 0,
          total: 3
        },
        {
          position: 'top',
          index: 1,
          total: 3
        },
        {
          position: 'top',
          index: 2,
          total: 3
        },
        {
          position: 'bottom',
          index: 0,
          total: 3
        },
        {
          position: 'bottom',
          index: 1,
          total: 3
        },
        {
          position: 'bottom',
          index: 2,
          total: 3
        },
        {
          position: 'left',
          index: 0,
          total: 1
        },
        {
          position: 'right',
          index: 0,
          total: 1
        }
      ];
    }

    return [
      {
        position: 'top',
        index: 0,
        total: 1
      },
      {
        position: 'bottom',
        index: 0,
        total: 1
      }
    ];
  }


  /* =====================================================
     DEFAULT POSITIONS
  ====================================================== */

  getDefaultX(
    index: number
  ): number {

    const gap = 150;

    return (
      40 +
      (
        index % 7
      ) * gap
    );
  }


  getDefaultY(
    index: number
  ): number {

    const gap = 130;

    return (
      45 +
      Math.floor(
        index / 7
      ) * gap
    );
  }


  trackById(
    _: number,
    table: FloorTable
  ): number {

    return table.id;
  }

  @HostListener('document:click')
    closeContactActions(): void {
      this.showRestaurantMenu = false;
    }
  
    toggleRestaurantMenu(
      event: MouseEvent
    ): void {
  
      event.stopPropagation();
  
      this.showRestaurantMenu =
        !this.showRestaurantMenu;
    }
  
  
  
    logoutFromMenu(
      event: MouseEvent
    ): void {
  
      event.stopPropagation();
  
      this.logout();
    }
  
    logout(): void {
      localStorage.removeItem(
        'authToken'
      );
  
      this.router.navigate([
        '/login'
      ]);
    }


  ngOnDestroy(): void {

    this.sub.unsubscribe();
  }

}
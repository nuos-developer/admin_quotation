import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { PackagesComponant } from './packages.componant';

describe('PackagesComponant', () => {
  let component: PackagesComponant;
  let fixture: ComponentFixture<PackagesComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackagesComponant],
      providers: [MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackagesComponant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

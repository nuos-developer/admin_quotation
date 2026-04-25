import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientComponant } from './client.componant';

describe('ClientComponant', () => {
  let component: ClientComponant;
  let fixture: ComponentFixture<ClientComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientComponant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/user.model'
import { AppComponent } from '../../app.component';

@Injectable({ providedIn: 'root' })
export class AdminService {
    constructor(private http: HttpClient) { }

    dashboard() {
        return this.http.get(`${environment.apiUrl}/admin/dashboard`);
    }

    getUsers() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/getUsers`
        );
    }

    getRoles() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/roles`
        );
    }

    getModules() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/getModule`
        );
    }

    getUserPermissions(userId: number) {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/permissions/${userId}`
        );
    }

    assignPermission(payload: any) {
        return this.http.post(`${environment.apiUrl}/admin/assign_access`, payload);
    }

    addProduct(formData: any) {
        return this.http.post(`${environment.apiUrl}/admin/product/addProduct`, formData);
    }

    UpdateProduct(productId: number, formData: any) {

        console.log(formData);
        
        return this.http.put(`${environment.apiUrl}/admin/product/updateProduct/${productId}`, formData);
    }

    getActiveProduct() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getProduct`
        );
    }

    getInactiveProduct() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getInactiveProduct`
        );
    }
    inactiveProduct(productId: number) {
        return this.http.delete<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/deleteProduct/${productId}`
        );
    }
    activeProduct(productId: number) {
        return this.http.delete<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/activeProduct/${productId}`
        );
    }
    getWire() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/wire_type`
        );
    }
    getProposals() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getproposal`
        );
    }
    getProposalById(proposalId : number) {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getproposalById/${proposalId}`
        );
    }
    deleteProposal(productId: number) {
        return this.http.delete<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/delete_proposal/${productId}`
        );
    }


}

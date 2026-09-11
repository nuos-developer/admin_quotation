import { HttpClient, HttpParams } from '@angular/common/http';
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

    dashboardGraph(graph: string, fromDate?: string, toDate?: string) {
        let params = new HttpParams().set('graph', graph);

        if (fromDate && toDate) {
            params = params.set('fromDate', fromDate).set('toDate', toDate);
        }

        return this.http.get(
            `${environment.apiUrl}/admin/dashboard/graph`,
            { params }
        );
    }


    getProductsList() {
        return this.http.get(`${environment.apiUrl}/admin/dashboard/list`);
    }

    getProductUsageTrend(productId: string | number, period: string, fromDate?: string, toDate?: string) {
        let params = new HttpParams()
            .set('product_id', productId)
            .set('period', period);

        if (fromDate && toDate) {
            params = params.set('from', fromDate).set('to', toDate);
        }

        return this.http.get(
            `${environment.apiUrl}/admin/dashboard/usage-trend`,
            { params }
        );
    }

    productUsageStats(period?: string, fromDate?: string, toDate?: string) {
        let params = new HttpParams();

        if (fromDate && toDate) {
            params = params.set('from', fromDate).set('to', toDate);
        } else if (period) {
            params = params.set('period', period);
        }

        return this.http.get(
            `${environment.apiUrl}/admin/dashboard/usage-stats`,
            { params }
        );
    }

    getUsers() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/getUsers`
        );
    }

    getClient() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/get_client_data`
        );
    }

    getRoles() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/roles`
        );
    }

    getLeads() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/get_lead_status`
        );
    }
    getReference() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/get_reference`
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

    deleteUser(id: number) {
        return this.http.delete(
            `${environment.apiUrl}/admin/delete_user/${id}`
        );
    }

    addProduct(formData: any) {
        return this.http.post(`${environment.apiUrl}/admin/product/addProduct`, formData);
    }


    UpdateProduct(productId: number, formData: any) {

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

    getPackages() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/get_package`
        );
    }

    getProductName() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/get_product_name`
        );
    }

    getRoomPackages() {
        return this.http.get<any>(
            `${environment.apiUrl}/admin/get_room_packages`
        );
    }

    createRoomPackage(data: any) {
        return this.http.post<any>(
            `${environment.apiUrl}/admin/create_room_package`,
            data
        );
    }

    createClient(data: any) {
        return this.http.post<any>(
            `${environment.apiUrl}/users/create_client`,
            data
        );
    }

    getCategories() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/category_type`
        );
    }

    getProposals() {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getproposal`
        );
    }
    getProposalById(proposalId: number) {
        return this.http.get<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/getproposalById/${proposalId}`
        );
    }
    deleteProposal(productId: number) {
        return this.http.delete<ApiResponse<any[]>>(
            `${environment.apiUrl}/admin/product/delete_proposal/${productId}`
        );
    }
    insertProposal(data: any) {
        return this.http.post<any>(
            `${environment.apiUrl}/admin/product/insertProposal`,
            data
        );
    }
    updateProposal(id: number, data: any) {
        return this.http.put<any>(
            `${environment.apiUrl}/admin/product/proposal/${id}`,
            data
        );
    }

    updateRoomPackage(id: number, data: any) {
        return this.http.put<any>(
            `${environment.apiUrl}/admin/update_room_package/${id}`,
            data
        );
    }
    updateClient(id: number, data: any) {
        return this.http.put<any>(
            `${environment.apiUrl}/users/update_cleint/${id}`,
            data
        );
    }

    updateProposalStatus(id: number, data: any) {
        return this.http.put<any>(
            `${environment.apiUrl}/admin/product/update_proposal_status/${id}`,
            data
        );
    }

    deleteRoomPackage(id: number) {
        return this.http.delete<any>(
            `${environment.apiUrl}/admin/delete_room_package/${id}`
        );
    }


}

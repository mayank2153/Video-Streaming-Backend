class ApiResponse {
    constructor(statusCode,message="Success",data){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success=statusCode<400;
        // success is a boolean flag indicating whether the response indicates success or failure. It's determined based on whether the status code is less than 400 (indicating success) or not.
    }
}
export {ApiResponse}
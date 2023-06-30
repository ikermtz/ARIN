/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | S.López    |  21/02/23  | ICL_E005 - Actualización campos pedido desde albarán/recepción      |
     |  1.1    | S.López    |  20/03/23  | ICL_E027 - Precio transporte en albarán y recepción                 |
     |---------+------------+------------+---------------------------------------------------------------------+
     |   Traspasar modificaciones del albarána la línea de pedido.                                             |
     +---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 * @NScriptType WorkflowActionScript
 */

function editItemFulfillment10(id, type, form){

    nlapiLogExecution('DEBUG', 'Inicio ejecución editItemFulfillment10_WF');

    if(type == "xedit"){ 
    return true;
    }

    var fulfillmentOld = nlapiGetOldRecord();
    var fulfillment = nlapiGetNewRecord();    

    // Inicializar variables
    var modificarContenedor = 0;
    var modificarPrecinto = 0;
    var modificarBLNumber = 0;
    var modificarGrossWeight = 0;
    var modificarPackages = 0;
    var modificarFecha = 0;
    //++[SLV] ICL_E027. (20/03/2023)
    //Añadir nueva lógica para nuevos campos editables
    var modificarTarifaTrans = 0;
    var modificarAgenciaTrans = 0;
    //--[SLV] ICL_E027. (20/03/2023)
    //Buscamos los id la asignación y el pedido a modificar
    var asignacionid =  fulfillment.getFieldValue('custbody_x_geas_assigncode');
    nlapiLogExecution('DEBUG', 'asignacionid:', asignacionid);
    var salesOrderId = fulfillment.getFieldValue('createdfrom');
    nlapiLogExecution('DEBUG', 'salesOrderId:', salesOrderId);

    var cont = fulfillment.getFieldValue('custbody_x_contenedor');
    var contOld = fulfillmentOld.getFieldValue('custbody_x_contenedor');

    var prec = fulfillment.getFieldValue('custbody_x_precinto');
    var precOld = fulfillmentOld.getFieldValue('custbody_x_precinto');

    var bl = fulfillment.getFieldValue('custbody_x_blnumber');
    var blOld = fulfillmentOld.getFieldValue('custbody_x_blnumber');

    var gw = fulfillment.getFieldValue('custbody_x_grossweight');
    var gwOld = fulfillmentOld.getFieldValue('custbody_x_grossweight');

    var pkg = fulfillment.getFieldValue('custbody_x_packages');
    var pkgOld = fulfillmentOld.getFieldValue('custbody_x_packages');

    var date = fulfillment.getFieldValue('trandate');
    var dateOld = fulfillmentOld.getFieldValue('trandate');

    var tr = fulfillment.getFieldValue('custbody_ai_transport_rate'); 
    var trOld = fulfillmentOld.getFieldValue('custbody_ai_transport_rate');

    var ta = fulfillment.getFieldValue('custbody_ai_transport_agency');
    var taOld = fulfillmentOld.getFieldValue('custbody_ai_transport_agency');

    if(asignacionid){

        // Comprobamos si se han modificado los campos de cabecera del albarán
        if(cont == null){
            cont = '';
        } else if(contOld == null){
            contOld = '';
        } else if(cont!=contOld){
            modificarContenedor = 1;
            nlapiLogExecution('DEBUG', 'Modifica contenedor');
        } var contaux = cont + '*';
        var contoldaux = contOld + '*';
        if(contaux!=contoldaux){ 
            modificarContenedor = 1;
            nlapiLogExecution('DEBUG', 'Modifica contenedor');
        }

        if(prec == null){
            prec = '';
        } else if(precOld == null){
            precOld = '';
        } else if(prec!=precOld){ 
            modificarPrecinto = 1;
            nlapiLogExecution('DEBUG', 'Modifica precinto');
        } var precaux = prec + '*';
        var precoldaux = precOld + '*';
        if(precaux!=precoldaux){ 
            modificarPrecinto = 1;
            nlapiLogExecution('DEBUG', 'Modifica precinto');
        }

        if(bl == null){
            bl = '';
        } else if(blOld == null){
            blOld = '';
        } else if(bl!=blOld || blOld=='' && bl!=''){ 
            modificarBLNumber = 1;
            nlapiLogExecution('DEBUG', 'Modifica bl number');
        } var blaux = bl + '*';
        var bloldaux = blOld + '*';
        if(blaux!=bloldaux){ 
            modificarBLNumber = 1;
            nlapiLogExecution('DEBUG', 'Modifica bl number');
        }

        if(gw == null){
            gw = '';
        } else if(gwOld == null){
            gwOld = '';
        } else if(gw!=gwOld){ 
            modificarGrossWeight = 1;
            nlapiLogExecution('DEBUG', 'Modifica gross weight');
        } var gwaux = gw + '*';
        var gwoldaux = gwOld + '*';
        if(gwaux!=gwoldaux){ 
            modificarGrossWeight = 1;
            nlapiLogExecution('DEBUG', 'Modifica gross weight');
        }

        if(pkg == null){
            pkg = '';
        } else if(pkgOld == null){
            pkgOld = '';
        } else if(pkg!=pkgOld){
            modificarPackages = 1;
            nlapiLogExecution('DEBUG', 'Modifica packages');
        } var pkgaux = pkg + '*';
        var pkgoldaux = pkgOld + '*';
        if(pkgaux!=pkgoldaux){ 
            modificarPackages = 1;
            nlapiLogExecution('DEBUG', 'Modifica packages');
        }

        if(date == null){
            date = '';
        } else if(dateOld == null){
            dateOld = '';
        } else if(date!=dateOld){
            modificarFecha = 1;     
            nlapiLogExecution('DEBUG', 'Modifica fecha');   
        }

        //++[SLV] ICL_E027. (20/03/2023)
        //Añadir nueva lógica para nuevos campos editables
        if(tr == null){
            tr = '';
        } else if(trOld == null){
            trOld = '';
        } else if(tr!=trOld){            
            modificarTarifaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica tarifa transporte');
        } var traux = tr + '*';
        var troldaux = trOld + '*';
        if(traux!=troldaux){ 
            modificarTarifaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica tarifa transporte');
        }

        if(ta == null){
            ta = '';
        } else if(taOld == null){
            taOld = '';
        } else if(ta!=taOld){
            modificarAgenciaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica agencia transporte');
        } var taaux = ta + '*';
        var taoldaux = taOld + '*';
        if(taaux!=taoldaux){ 
            modificarAgenciaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica agencia transporte');
        }
        //--[SLV] ICL_E027. (20/03/2023)

        //Actualizamos y cargamos la asignación
        var asignacion = nlapiLoadRecord('customrecord_x_tb_geas', asignacionid);
        nlapiLogExecution('DEBUG', 'asignacion: ', asignacion);


        //++[SLV] ICL_E027. (20/03/2023)
        //if(modificarContenedor == 1 || modificarPrecinto == 1 | modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1){
        if(modificarContenedor == 1 || modificarPrecinto == 1 | modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1){
            //--[SLV] ICL_E027. (20/03/2023)
            if(modificarContenedor == 1){
                asignacion.setFieldValue('custrecord_x_geas_container', fulfillment.getFieldValue('custbody_x_contenedor')); 
            }
            if(modificarPrecinto == 1){
                asignacion.setFieldValue('custrecord_x_geas_seal', fulfillment.getFieldValue('custbody_x_precinto')); 
            }
            if(modificarBLNumber == 1){                
                asignacion.setFieldValue('custrecord_x_geas_blnumber', fulfillment.getFieldValue('custbody_x_blnumber')); 
            }
            if(modificarGrossWeight == 1){
                asignacion.setFieldValue('custrecord_x_geas_grossweight', fulfillment.getFieldValue('custbody_x_grossweight')); 
            }
            if(modificarPackages == 1){
                asignacion.setFieldValue('custrecord_x_geas_packages', fulfillment.getFieldValue('custbody_x_packages'));

            }
            
            //++[SLV] ICL_E027. (20/03/2023)
            //Añadir modificación nuevos campos editables
            if(modificarTarifaTrans == 1){
                asignacion.setFieldValue('custrecord_x_geas_rateprice', fulfillment.getFieldValue('custbody_ai_transport_rate'));
            }
            if(modificarAgenciaTrans == 1){
                asignacion.setFieldValue('custrecord_x_geas_transprovider', fulfillment.getFieldValue('custbody_ai_transport_agency'));
            }
            //--[SLV] ICL_E027. (20/03/2023)
        }

        //Nos recorremos las líneas del albarán para validar que ha cambiado
        var numLineasAlb = nlapiGetLineItemCount('item');

        for(var i = 1; i <= numLineasAlb; i++){
            
            // Inicializar variables
            var modificarCantidad = 0;
            var modificarLocation = 0;
            var modificarOwnedLocation = 0;
            var modificarDepositLocation = 0;

            var lineRelAlb = fulfillment.getLineItemValue('item', 'custcol_x_orderfulfillmentlinerel', i);
            nlapiLogExecution('DEBUG', 'lineRelAlb: ', lineRelAlb);

            // Comprobamos si han cambiado los campos a nivel de línea
            if(fulfillment.getLineItemValue('item', 'quantity', i) != fulfillmentOld.getLineItemValue('item', 'quantity', i)){       
                modificarCantidad = 1;
                nlapiLogExecution('DEBUG', 'Modifica cantidad');
            }
            if(fulfillment.getLineItemValue('item', 'location', i) != fulfillmentOld.getLineItemValue('item', 'location', i)){       
                modificarLocation = 1;
                nlapiLogExecution('DEBUG', 'Modifica location');
            }

            //Actualizamos las líneas de la asignación
            if(modificarCantidad == 1 || modificarLocation == 1){

                var numLineasAsig = asignacion.getLineItemCount('recmachcustrecord_x_geasli_parent');      
                nlapiLogExecution('DEBUG', 'numLineasAsig: ', numLineasAsig);

                for(var j = 1; j <= numLineasAsig; j++){
                    //Cogemos de la recmach porque es en la que tenemos la línea relacionada del albarán
                    var lineRelAsig =  asignacion.getLineItemValue('recmachcustrecord_x_geasli_parent', 'custrecord_x_geasli_orderfulfillmentline', j);      
                    nlapiLogExecution('DEBUG', 'lineRelAsig: ', lineRelAsig);
                    nlapiLogExecution('DEBUG', 'lineRelAlb: ',lineRelAlb);

                    if(modificarCantidad == 1){
                        //Hay que actualizar el custpage, como si lo hiciesemos por pantalla para que no haya problemas con el asigment UE
                        if(lineRelAlb == lineRelAsig){
                            asignacion.setLineItemValue('custpage_x_recmachcustrecord_x_geasli_parent1', 'custpage_custrecord_x_geasli_qty', j, fulfillment.getLineItemValue('item','quantity',i));
                        } 
                    }
                    if(modificarLocation == 1){
                        if(lineRelAlb == lineRelAsig){
                            asignacion.setLineItemValue('custpage_x_recmachcustrecord_x_geasli_parent1', 'custpage_custrecord_x_geasli_locationfrom', j, fulfillment.getLineItemValue('item', 'location', i)); 
                        }
                    }
                }
            }

            if(modificarContenedor == 1 || modificarPrecinto == 1 || modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1 || modificarCantidad == 1 || modificarLocation == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarFecha == 1){
                //Guardamos asignación
                var servicePurchaseId = asignacion.getFieldValue('custrecord_x_geas_purchaseserviceorder');
                var serviceSalesId = asignacion.getFieldValue('custrecord_x_geas_salesserviceorder');
                nlapiSubmitRecord(asignacion, true, false); 
                var asignacion = nlapiLoadRecord('customrecord_x_tb_geas', asignacionid);
            }

            // Actualizamos el pedido
            if(modificarContenedor == 1 || modificarPrecinto == 1 || modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1 || modificarCantidad == 1 || modificarLocation == 1 || modificarOwnedLocation == 1 || modificarDepositLocation == 1 || modificarFecha == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1){
                
                var lineasOriginal = new Array();
                var lineasPendientes = new Array();
                //++[SLV] ICL_E006. (06/06/2023)
                var lineasPrefactura = new Array();
                //--[SLV] ICL_E006. (06/06/2023)

                // Cargar el pedido en funcion del tipo
                if(fulfillment.getFieldValue('ordertype') == 'TrnfrOrd'){
                    
                    //Pedido de transferencia, no actualizamos ni creamos nada
                    var salesOrder = nlapiLoadRecord('transferorder', salesOrderId);
                    nlapiLogExecution('DEBUG', 'transferOrder:', 'Transfer order');
                } else {
                    
                    // Pedido de venta
                    var salesOrder = nlapiLoadRecord('salesorder', salesOrderId);
                    nlapiLogExecution('DEBUG', 'salesOrder:', 'Sales order');

                    var numLineasPed = salesOrder.getLineItemCount('item');   
                    
                    for(var j = 1; j <= numLineasPed; j++){
                        
                        salesOrder.selectLineItem('item', j);
                        nlapiLogExecution('DEBUG', 'linea numero:', j);

                        // Actualizamos la info de la asignacion                     
                        var asigSales = salesOrder.getCurrentLineItemValue('item', 'custcol_x_geas_assigncode'); 
                        nlapiLogExecution('DEBUG', 'asigSales:', asigSales);

                        if(asigSales == asignacionid){
                            if(modificarContenedor == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_container', fulfillment.getFieldValue('custbody_x_contenedor')); //j
                            }
                            if(modificarPrecinto == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_alb_precinto', fulfillment.getFieldValue('custbody_x_precinto')); 
                            }
                            if(modificarBLNumber == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_alb_numero_bl', fulfillment.getFieldValue('custbody_x_blnumber')); 
                            }
                            if(modificarGrossWeight == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_alb_peso_bruto', fulfillment.getFieldValue('custbody_x_grossweight'));
                            }
                            if(modificarPackages == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_bultos_albaran', fulfillment.getFieldValue('custbody_x_packages'));
                            }
                            if(modificarFecha == 1){
                                //Modificamos las líneas que tengan la asignación asociada
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_fulfillmentdate', fulfillment.getFieldValue('trandate'));
                                //Añadir el siguiente campo, aunque es un campo duplicado, hasta que se haga limpieza, deberá informarse para que quede en consonancia// ACTUALIZADO
                                salesOrder.setCurrentLineItemValue('item', 'custcol_icl_apv_trandate', fulfillment.getFieldValue('trandate')); 
                            }
                        }

                        //Actualizamos la info de la línea del albarán
                        var lineRelSales = salesOrder.getCurrentLineItemValue('item', 'custcol_x_orderfulfillmentlinerel'); 

                        if(lineRelAlb == lineRelSales){
                            
                            if(modificarCantidad == 1){
                                
                                //Modificamos la línea que tenga la línea de albarán relacionada
                                nlapiLogExecution('DEBUG', 'Cantidad a modificar: ', fulfillment.getLineItemValue('item','quantity',i));
                                nlapiLogExecution('DEBUG', 'Cantidad a modificar old: ', fulfillmentOld.getLineItemValue('item','quantity',i)); 
                                salesOrder.setCurrentLineItemValue('item', 'quantity', fulfillment.getLineItemValue('item', 'quantity', i));

                                //Tenemos que modificar también los campos de la asignación
                                var pesoTotal = asignacion.getFieldValue('custrecord_x_geas_totalweight'); 
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_totalweight', pesoTotal); 
                                var tarifa = asignacion.getFieldValue('custrecord_x_geas_rateprice'); 
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_rateprice',tarifa); 

                                //Obtenemos la línea original para ver si hay que actualizar cantidades pendientes// OBTENER LINEA ANTERIOR
                                var originalLine = salesOrder.getCurrentLineItemValue('item', 'custcol_x_originalorderline'); //line j 
                                nlapiLogExecution('DEBUG', 'Tiene linea');
                                
                                //Diferencia cantidad
                                var diferencia = parseFloat(fulfillmentOld.getLineItemValue('item', 'quantity', i)) - parseFloat(fulfillment.getLineItemValue('item', 'quantity', i));
                                nlapiLogExecution('DEBUG', 'Diferencia', diferencia);
                                
                                //Buscamos la línea original y le hacemos el ajuste de cantidad
                                lineasOriginal.push({
                                    lineaOrig: originalLine,
                                    item: salesOrder.getCurrentLineItemValue('item', 'item'), 
                                    location: salesOrder.getCurrentLineItemValue('item', 'location'),
                                    tasaManual: salesOrder.getCurrentLineItemValue('item', 'custcol_x_tasamanual'),
                                    rate: salesOrder.getCurrentLineItemValue('item', 'rate'),
                                    precioTarifa: salesOrder.getCurrentLineItemValue('item', 'custcol_x_precio_tarifa'),
                                    taxCode: salesOrder.getCurrentLineItemValue('item', 'taxcode'),
                                    orderLineVision: salesOrder.getCurrentLineItemValue('item', 'custcol_x_orderlinedivision'),
                                    origOrderLine: lineRelAlb,
                                    originalOrderQty: salesOrder.getCurrentLineItemValue('item', 'custcol_x_originalorderquantity'),
                                    preSalesInvoice: salesOrder.getCurrentLineItemValue('item', 'custcol_presalesinvoice'),
                                    otherRefNum: salesOrder.getCurrentLineItemValue('item', 'custcol_otherrefnum'),
                                    shipObs: salesOrder.getCurrentLineItemValue('item', 'custcol_shipmentobservations'),
                                    deliveryDateStart: salesOrder.getCurrentLineItemValue('item', 'custcol_deliverydatestart'),
                                    deliveryDateDead: salesOrder.getCurrentLineItemValue('item', 'custcol_deliverydatedeadline'),
                                    creationDate: salesOrder.getCurrentLineItemValue('item', 'custcol_creationdate'),
                                    shipDeliType: salesOrder.getCurrentLineItemValue('item', 'custcol_shippingdeliverytype'),
                                    orderNumber: salesOrder.getCurrentLineItemValue('item', 'custcol_ordernumber'),
                                    orderNumberId: salesOrder.getCurrentLineItemValue('item', 'custcol_ordernumberid'),
                                    densidad: salesOrder.getCurrentLineItemValue('item','custcol_x_densidad'),
                                    codigoTaric: salesOrder.getCurrentLineItemValue('item', 'custcol_x_codigotaric'),
                                    countryOrig: salesOrder.getCurrentLineItemValue('item', 'custcol_country_of_origin_code'),
                                    diferencia: diferencia
                                })     

                                //++[SLV] ICL_E006. (06/06/2023)
                                //Añadir lógica para prefactura
                                //- Validamos si la línea que estamos actualizando tiene prefactura asignada
                                var prefactura = salesOrder.getCurrentLineItemValue('item', 'custcol_presalesinvoice');
                                nlapiLogExecution('DEBUG', 'Prefactura', prefactura);

                                if(!!prefactura){
                                    //Tendremos que mirar en los movimientos si hay cantidad disponible
                                    //Si la cantidad qe actualizamos es mayor
                                    if(diferencia < 0){
                                        //var cantidadDiponible = preinvoice_utils.getCantidadPrefactura(prefactura);
                                        var cantidadDiponible = getCantidadPrefactura(prefactura);
                                        var cantidadNecesariaPrefactura = parseFloat(diferencia)*-1;
                                        nlapiLogExecution('DEBUG',  'cantidadDiponible: ', cantidadDiponible);
                                        nlapiLogExecution('DEBUG',  'cantidadNecesariaPrefactura: ', cantidadNecesariaPrefactura);

                                        // - Si hay cantidad disponible entonces actualizamos la línea y la negativa y actualizar histórico
                                        if(cantidadDiponible > 0 && cantidadDiponible >= cantidadNecesariaPrefactura){
                                            //Actualizamos movmiento del hisórico
                                            nlapiLogExecution('DEBUG',  'prefactura ENTRA1:');
                                            //var idMovHist = preinvoice_utils.getIdHistorico(prefactura, salesOrderId, lineRelSales);
                                            var idMovHist = getIdHistorico(prefactura, salesOrderId, lineRelSales);
                                            var cantidadActualizar = parseFloat(fulfillment.getLineItemValue('item', 'quantity', i))*-1;

                                            nlapiLogExecution('DEBUG',  'idMovHist: ', idMovHist);
                                            nlapiLogExecution('DEBUG',  'cantidadActualizar: ', cantidadActualizar);
                                            nlapiSubmitField('customrecord_ai_historic_preinvoice', idMovHist, 'custrecord_ai_preinvoice_qty', cantidadActualizar);

                                            //Añadimos actualización línea negativa del sales order de prefactura
                                            lineasPrefactura.push({
                                                prefactura: prefactura,
                                                cantidad: cantidadActualizar
                                            }) 
                                        }
                                    }
                                    //Si la cantidad es menor, restamos a la línea y la negativa y sumamos en histórico
                                    else{
                                        //Actualizamos movmiento del hisórico
                                        nlapiLogExecution('DEBUG',  'prefactura ENTRA4:');
                                        //var idMovHist = preinvoice_utils.getIdHistorico(prefactura, salesOrderId, lineRelSales);
                                        var idMovHist = getIdHistorico(prefactura, salesOrderId, lineRelSales);
                                        var cantidadActualizar = parseFloat(fulfillment.getLineItemValue('item', 'quantity', i))*-1;
                                        nlapiSubmitField('customrecord_ai_historic_preinvoice', idMovHist, 'custrecord_ai_preinvoice_qty', cantidadActualizar);

                                        //Añadimos actualización línea negativa del sales order de prefactura
                                        lineasPrefactura.push({
                                            prefactura: prefactura,
                                            cantidad: cantidadActualizar
                                        });
                                    }
                                }
                                //--[SLV] ICL_E006. (06/06/2023)                       
                            }

                            if(modificarLocation == 1){
                                //Modificamos la línea que tenga la línea de albarán relacionada
                                salesOrder.setCurrentLineItemValue('item', 'location', fulfillment.getLineItemValue('item', 'location', i)); //line j
                            }
                            if(modificarTarifaTrans == 1){
                                //Tenemos que modificar también los campos de la asignación
                                var pesoTotal = asignacion.getFieldValue('custrecord_x_geas_totalweight'); 
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_totalweight', pesoTotal);
                                var tarifa = asignacion.getFieldValue('custrecord_x_geas_rateprice'); 
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_rateprice', tarifa);
                            }
                            if(modificarAgenciaTrans == 1){
                                //Tenemos que modificar también los campos de la asignación
                                var entityid;
                                if(!!fulfillment.getFieldValue('custbody_ai_transport_agency')){                                    
                                    entityid = nlapiLookupField('vendor', fulfillment.getFieldValue('custbody_ai_transport_agency'), 'entityid');
                                }
                                salesOrder.setCurrentLineItemValue('item', 'custcol_x_geas_agency', entityid);
                            }
                        }
                        salesOrder.commitLineItem('item');
                    } 
                }
            }
            if(modificarContenedor == 1 || modificarPrecinto == 1 || modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1 || modificarCantidad == 1 || modificarLocation == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarFecha == 1){
                
                // Guardar asignacion
                /*var servicePurchaseId = asignacion.getFieldValue('custrecord_x_geas_purchaseserviceorder');
                nlapiLogExecution('DEBUG', 'servicePurchaseId: ',servicePurchaseId);
                var serviceSalesId = asignacion.getFieldValue('custrecord_x_geas_salesserviceorder');
                nlapiLogExecution('DEBUG', 'serviceSalesId: ',serviceSalesId);*/

                if(modificarCantidad == 1){
                    
                    //Actualizar pendientes en pedido
                    //--Nos recorremos las líenas del pedido para actualizar la cantidad de la líena original
                    if(!!lineasOriginal){
                        
                        //Nos recorremos el array de líneas originales para validar si hay pendientes
                        for(var k = 0; k < lineasOriginal.length; k++){
                            
                            //Nos recorremos el pedido
                            var encontrado = 0;
                            nlapiLogExecution('DEBUG', 'entra: ',lineasOriginal.length);
                            for(var j = 1; j <= numLineasPed; j++){
                                
                                salesOrder.selectLineItem('item', j);
                                //Obtenemos la línea relacionada de la línea
                                var lineaRelAlb = salesOrder.getCurrentLineItemValue('item', 'custcol_x_orderfulfillmentlinerel');
                                nlapiLogExecution('DEBUG', 'lineaRelAlb pedido: ', lineaRelAlb);
    
                                //Descartamos que tenga en cuenta la línea que estamos actualizando
                                if(lineaRelAlb != lineasOriginal[k].origOrderLine){
                                    //Comprobamos pendientes
                                    var backorder = salesOrder.getCurrentLineItemValue('item','quantitybackordered');
                                    nlapiLogExecution('DEBUG', 'backorder: ', backorder);
                                    var commited = salesOrder.getCurrentLineItemValue('item', 'quantitycommitted');
                                    nlapiLogExecution('DEBUG', 'commited: ', commited);
                                    var sumapendientes = parseFloat(backorder)+parseFloat(commited);
                                    nlapiLogExecution('DEBUG', 'sumapendientes: ', sumapendientes);
                                    
                                    if(encontrado == 0 && sumapendientes != 0){
                                        
                                        //Encontrada línea con pendientes y actualizamos
                                        encontrado = 1;
                                        var cantidadOriginal = salesOrder.getCurrentLineItemValue('item', 'quantity');
                                        cantidadOriginal = parseFloat(cantidadOriginal) + parseFloat(lineasOriginal[k].diferencia);
                                        nlapiLogExecution('DEBUG', 'cantidadUpdatear: ', cantidadOriginal);

                                        if(cantidadOriginal <= 0){
                                            
                                            //++[SLV] ICL_E006. (06/06/2023)
                                            //No eliminar si es prefactura, que también cumple con que la cantidad es negativa
                                            var prefactura = salesOrder.getCurrentLineItemValue('item', 'custcol_presalesinvoice');

                                            if(!prefactura){
                                                //Eliminar línea ya que no tiene nada pendiente
                                                salesOrder.removeLineItem('item', j);
                                                break;
                                            }
                                            //--[SLV] ICL_E006. (06/06/2023)
                                        }
                                        else{
                                            salesOrder.setCurrentLineItemValue('item', 'quantity',cantidadOriginal); 
                                            salesOrder.commitLineItem('item');
                                        }
                                    }
                                }
                            }

                            nlapiLogExecution('DEBUG', 'encontrado: ', encontrado);
                            nlapiLogExecution('DEBUG', 'diferencia: ', lineasOriginal[k].diferencia);

                            if(encontrado == 0 && lineasOriginal[k].diferencia > 0){
                                
                                //Hay que crear línea
                                lineasPendientes.push({
                                    item: lineasOriginal[k].item,
                                    location: lineasOriginal[k].location,
                                    tasaManual: lineasOriginal[k].tasaManual,
                                    rate: lineasOriginal[k].rate,
                                    precioTarifa: lineasOriginal[k].precioTarifa,
                                    taxCode: lineasOriginal[k].taxCode,
                                    orderLineVision: lineasOriginal[k].orderLineVision,
                                    origOrderLine: lineasOriginal[k].origOrderLine,
                                    originalOrderQty: lineasOriginal[k].originalOrderQty,
                                    preSalesInvoice: lineasOriginal[k].preSalesInvoice,
                                    otherRefNum: lineasOriginal[k].otherRefNum,
                                    shipObs: lineasOriginal[k].shipObs,
                                    deliveryDateStart: lineasOriginal[k].deliveryDateStart,
                                    deliveryDateDead: lineasOriginal[k].deliveryDateDead,
                                    creationDate: lineasOriginal[k].creationDate,
                                    shipDeliType: lineasOriginal[k].shipDeliType,
                                    orderNumber: lineasOriginal[k].orderNumber,
                                    orderNumberId: lineasOriginal[k].orderNumberId,
                                    densidad: lineasOriginal[k].densidad,
                                    codigoTaric: lineasOriginal[k].codigoTaric,
                                    countryOrig: lineasOriginal[k].countryOrig,
                                    quantity: lineasOriginal[k].diferencia
                                })
                            }
                        }
                    }

                    //++[SLV] ICL_E006. (06/06/2023)
                    //Actualizar las líneas negativas de la prefactura
                    if(!!lineasPrefactura){
                        //Nos recorremos el array de líneas originales para validar si hay pendientes
                        for(var k = 0; k < lineasPrefactura.length; k++){
                            for(var j = 1; j <= numLineasPed; j++){

                                salesOrder.selectLineItem( 'item', j);
                                var prefactura = salesOrder.getCurrentLineItemValue( 'item', 'custcol_presalesinvoice');
                                var cantidad = salesOrder.getCurrentLineItemValue('item', 'quantity');
                                nlapiLogExecution('DEBUG', 'prefactura: ', prefactura);
                                nlapiLogExecution('DEBUG', 'cantidad prefactura: ', cantidad);

                                if(prefactura == lineasPrefactura[k].prefactura && cantidad < 0){
                                    nlapiLogExecution( 'DEBUG', 'Entra a updatear prefactura: ', lineasPrefactura[k].cantidad);
                                    //Actualizar cantidad
                                    salesOrder.setCurrentLineItemValue('item', 'quantity', lineasPrefactura[k].cantidad); 
                                    salesOrder.commitLineItem('item');
                                }
                            }
                        }
                    }
                    //--[SLV] ICL_E006. (06/06/2023)
                }
                
                if(modificarCantidad == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarFecha == 1 || modificarLocation == 1){
                    
                    if(!!serviceSalesId || !!servicePurchaseId){
                        
                        //asignacion = nlapiLoadRecord('customrecord_x_tb_geas',fulfillment.getFieldValue('custbody_x_geas_assigncode'));  

                        var pesoTotal = asignacion.getFieldValue('custrecord_x_geas_totalweight'); 
                        //En service sales tiene que ir en toneladas y no en kilos
                        //pesoTotal = pesoTotal * 1000;//Multiplicamos porque en la asignación está en Toneladas y aquí en Kilos

                        var precio = asignacion.getFieldValue('custrecord_x_geas_price'); 

                        var rateprice = asignacion.getFieldValue('custrecord_x_geas_rateprice'); 

                        nlapiLogExecution('DEBUG', 'pesoTotal: ', pesoTotal);
                        nlapiLogExecution('DEBUG', 'precio: ', precio);
                        nlapiLogExecution('DEBUG', 'rateprice: ', rateprice);
                    }

                    nlapiLogExecution('DEBUG', 'serviceSalesId: ', serviceSalesId);
                    if(!!serviceSalesId){
                        //Tenemos que actualizar 
                        var serviceSales = nlapiLoadRecord('salesorder', serviceSalesId);
                        nlapiLogExecution('DEBUG', 'serviceSales: ', serviceSales);

                        serviceSales.setFieldValue('custbody_x_geas_totalweight', pesoTotal); 
                        var numLineasSS = serviceSales.getLineItemCount('item');

                        for(var k = 1; k <= numLineasSS; k++){
                            //Solo la líena que sea de la asignación
                            var asigservice = serviceSales.getLineItemValue('item', 'custcol_x_geas_assigncode', k); 
                            if(asigservice == asignacionid){
                                //Peso total
                                serviceSales.setLineItemValue('item','custcol_x_geas_totalweight', k, pesoTotal);
                                //Amount
                                serviceSales.setLineItemValue('item','amount', k, precio);  
                                //Rate
                                serviceSales.setLineItemValue('item','rate', k, precio); 
                                //Rate price
                                serviceSales.setLineItemValue('item','custcol_x_geas_rateprice', k, rateprice); 
                                //Ciudad origen (si cambia la location)
                                if(modificarLocation == 1){
                                    var ciudadOrigen = asignacion.getFieldValue('custrecord_x_geas_cityorigin'); 
                                    serviceSales.setLineItemValue('item','custcol_x_geas_cityorigin', k, ciudadOrigen); 
                                }
                                //Fecha albarán
                                if(modificarFecha == 1){
                                    serviceSales.setLineItemValue('item', 'custcol_x_geas_fulfillmentdate', k, fulfillment.getFieldValue('trandate')); 
                                }
                            }
                        }
                        nlapiSubmitRecord(serviceSales, true, false); 
                    }

                    //Pedido compra servicio
                    //++[SLV] ICL_E027. (21/03/2023)
                    var avanzarPurchaseService = 1;
                    if(modificarAgenciaTrans == 1){
                        
                        if(!!fulfillment.getFieldValue('custbody_ai_transport_agency')){
                            //Validar si el nuevo transportista es un proveedor de transporte logística
                            var vendor = nlapiLoadRecord('vendor', fulfillment.getFieldValue('custbody_ai_transport_agency'));
                            var logistica = vendor.getFieldValue('custentity_x_vend_transportwithoutservpo');
                            nlapiLogExecution('DEBUG', 'check prov logistica: ', logistica);
                        }
                        else{
                            //Asignamos a true variable para que elimine pedido si lo han quitado
                            var logistica = true;
                        }
                        if(logistica == 'T'){
                            //Si está marcado (no aplica pedido compra) y hay pedido de compra, hay que borrarlo
                            if(!!servicePurchaseId){
                                nlapiDeleteRecord('purchaseorder',servicePurchaseId);
                                //Que no actualice el pedido ya que lo hemos borrado
                                avanzarPurchaseService = 0;
                                nlapiLogExecution('DEBUG', 'Pedido de compra servicio borrado', 'Borrado');
                            }
                        }
                        else{
                            //Si no está marcado (aplica pedido de compra) y no hay pedido de compra, hay que crearlo
                            if(!servicePurchaseId){
                                var idservpur = crearPedidoCompraServicio(asignacion, fulfillment.getFieldValue('trandate'));
                                nlapiSubmitField('customrecord_x_tb_geas', asignacionid, 'custrecord_x_geas_purchaseserviceorder', idservpur);
                                nlapiLogExecution('DEBUG', 'idservpur:', idservpur);
                                nlapiLogExecution('DEBUG', 'Pedido de compra servicio creado', 'Creado');
                            }
                        }                      
                    }
                    
                    nlapiLogExecution('DEBUG', 'servicePurchaseId:', servicePurchaseId);
                    //if(!!servicePurchaseId){
                    if(!!servicePurchaseId && avanzarPurchaseService == 1){ 
                        //--[SLV] ICL_E027. (21/03/2023)
                        //Tenemos que actualizar
                        var servicePurchase = nlapiLoadRecord('purchaseorder', servicePurchaseId);
                        nlapiLogExecution('DEBUG', 'servicePurchase:',servicePurchase);

                        //Peso total
                        pesoTotal = pesoTotal * 1000;
                        servicePurchase.setFieldValue('custbody_x_geas_totalweight', pesoTotal); 
                        //Rate price
                        servicePurchase.setFieldValue('custbody_x_geas_rateprice',rateprice); 

                        //Vendor
                        if(modificarAgenciaTrans == 1){
                            servicePurchase.setFieldValue('entity', fulfillment.getFieldValue('custbody_ai_transport_agency')); 
                        }
                        var numLineasSP = servicePurchase.getLineItemCount('item');

                        for(var k = 1; k <= numLineasSP; k++){
                            
                            //Amount
                            servicePurchase.setLineItemValue('item', 'amount', k, precio); 
                            //Rate
                            servicePurchase.setLineItemValue('item', 'rate', k, precio); 
                            //Total weight
                            servicePurchase.setLineItemValue('item', 'custcol_x_geas_totalweight', k, pesoTotal); 
                            //Rate price
                            servicePurchase.setLineItemValue('item', 'custcol_x_geas_rateprice', k, rateprice); 
                            //Fecha albarán
                            if(modificarFecha == 1){
                                servicePurchase.setLineItemValue('item', 'custcol_x_geas_fulfillmentdate', k, fulfillment.getFieldValue('trandate')); 
                            }
                            //Ciudad origen (si cambia la location)
                            if(modificarLocation == 1){
                                var ciudadOrigen = asignacion.getFieldValue('custrecord_x_geas_cityorigin'); 
                                servicePurchase.setLineItemValue('item','custcol_x_geas_cityorigin', k, ciudadOrigen); 
                            }
                        }
                        nlapiSubmitRecord(servicePurchase, true, false);
                    }
                }
                if(modificarCantidad == 1){
                    //Comprobamos si tenemos que generar líneas pendientes
                    if(!!lineasPendientes){
                        
                        nlapiLogExecution('DEBUG', 'lineasPendientes:', lineasPendientes);
                        for(var k = 0; k < lineasPendientes.length; k++){
                            //Cremos nueva línea en sales order
                            salesOrder.selectNewLineItem('item')
                            salesOrder.setCurrentLineItemValue('item', 'item', lineasPendientes[k].item);
                            salesOrder.setCurrentLineItemValue('item', 'location', lineasPendientes[k].location);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_tasamanual', lineasPendientes[k].tasaManual);
                            salesOrder.setCurrentLineItemValue('item', 'rate', lineasPendientes[k].rate);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_precio_tarifa', lineasPendientes[k].precioTarifa);
                            salesOrder.setCurrentLineItemValue('item', 'taxcode', lineasPendientes[k].taxCode);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_orderlinedivision', lineasPendientes[k].orderLineVision);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_originalorderline', lineasPendientes[k].origOrderLine);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_originalorderquantity', lineasPendientes[k].originalOrderQty);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_presalesinvoice', lineasPendientes[k].preSalesInvoice);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_otherrefnum', lineasPendientes[k].otherRefNum);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_shipmentobservations', lineasPendientes[k].shipObs);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_deliverydatestart', lineasPendientes[k].deliveryDateStart);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_deliverydatedeadline', lineasPendientes[k].deliveryDateDead);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_creationdate', lineasPendientes[k].creationDate);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_shippingdeliverytype', lineasPendientes[k].shipDeliType);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_ordernumber', lineasPendientes[k].orderNumber);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_ordernumberid', lineasPendientes[k].orderNumberId);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_densidad', lineasPendientes[k].densidad);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_x_codigotaric', lineasPendientes[k].codigoTaric);
                            salesOrder.setCurrentLineItemValue('item', 'custcol_country_of_origin_code', lineasPendientes[k].countryOrig);
                            salesOrder.setCurrentLineItemValue('item', 'quantity', lineasPendientes[k].quantity);
                            salesOrder.commitLineItem('item');
                        }
                    }
                }
                
                //Guardamos pedido
                if(modificarContenedor == 1 || modificarPrecinto == 1 || modificarBLNumber == 1 || modificarGrossWeight == 1 || modificarPackages == 1 || modificarCantidad == 1 || modificarLocation == 1 || modificarOwnedLocation == 1 || modificarDepositLocation == 1 || modificarFecha == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1){
                    if(fulfillment.getFieldValue('ordertype') != 'TrnfrOrd'){
                        nlapiSubmitRecord(salesOrder, true, false);            
                    }
                }
            }
        }
    }
    nlapiLogExecution('DEBUG', 'Fin ejecución editItemFulfillment10_WF');
}

//++[SLV] ICL_E027. (20/03/2023)
function crearPedidoCompraServicio(asignacion, trandate){

    var pedidoServicio = nlapiCreateRecord('purchaseorder', true);
    pedidoServicio.setFieldValue("entity", asignacion.getFieldValue('custrecord_x_geas_transprovider'));
    pedidoServicio.setFieldValue("subsidiary", getLogisticaID());
    pedidoServicio.setFieldValue("approvalstatus", 2);
    pedidoServicio.setFieldValue("custbody_x_geas_assigncode", asignacion.getFieldValue('id'));
    pedidoServicio.setFieldValue("custbody_x_geas_vendordeliverynumber", asignacion.getFieldValue('custrecord_x_geas_vendordeliverynumber'));
    pedidoServicio.setFieldValue("custbody_x_geas_fulfillment", asignacion.getFieldValue('custrecord_x_as_fulfillment'));
    pedidoServicio.setFieldValue("custbody_x_geas_totalweight",asignacion.getFieldValue('custrecord_x_geas_totalweight')*1000);
    pedidoServicio.setFieldValue("custbody_x_geas_rateprice", asignacion.getFieldValue('custrecord_x_geas_rateprice'));
    pedidoServicio.setFieldValue("custbody_x_geas_truck", asignacion.getFieldValue('custrecord_x_geas_truck'));
    pedidoServicio.setFieldValue("custbody_x_geas_cityorigin", asignacion.getFieldValue('custrecord_x_geas_cityorigin'));
    pedidoServicio.setFieldValue("custbody_x_geas_citydestiny", asignacion.getFieldValue('custrecord_x_geas_citydestiny'));
    pedidoServicio.setFieldValue("custbody_x_geas_fulfillmentdate", trandate);

    pedidoServicio.selectNewLineItem('item')
    pedidoServicio.setCurrentLineItemValue('item', 'item', obtenerIdItemServiciosWF());
    pedidoServicio.setCurrentLineItemValue('item', 'amount', asignacion.getFieldValue('custrecord_x_geas_price'));
    pedidoServicio.setCurrentLineItemValue('item', 'rate', asignacion.getFieldValue('custrecord_x_geas_price'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_tasamanual', 'T');
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_albaran_prov', asignacion.getFieldValue('custrecord_x_geas_vendordeliverynumber'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_fulfillment', asignacion.getFieldValue('custrecord_x_as_fulfillment'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_totalweight', asignacion.getFieldValue('custrecord_x_geas_totalweight')*1000);
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_rateprice', asignacion.getFieldValue('custrecord_x_geas_rateprice'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_truck', asignacion.getFieldValue('custrecord_x_geas_truck'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_cityorigin', asignacion.getFieldValue('custrecord_x_geas_cityorigin'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_citydestiny', asignacion.getFieldValue('custrecord_x_geas_citydestiny'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_fulfillmentdate', trandate);
    pedidoServicio.commitLineItem('item');

    return nlapiSubmitRecord(pedidoServicio, true, false);            
}

// Función de utilidades para obtener el ID de un artículo de servicios
//------------------------------------------------------------------------------------------------------
function obtenerIdItemServiciosWF(){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("internalid"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custitem_x_item_serviceitem",null,"is",'T'));
    
    var item = nlapiSearchRecord('item', null, filtros, columnas);
    
    return item[0].getValue('internalId');
}
//--[SLV] ICL_E027. (20/03/2023)

//------------------------------------------------------------------------------------------------------
// SLV (06/06/2023)
// Función que devuelve el id de un movimiento del histórico para una prefactura, un sales order y la línea del albarán
//------------------------------------------------------------------------------------------------------
function getIdHistorico(prefactura, salesOrder, fulfillmentLineRel) {
    
    nlapiLogExecution('DEBUG', 'Inicio funcion get id historico');

    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custrecord_ai_preinvoice_invoice",null,"is",prefactura));
    filtros.push(new nlobjSearchFilter("custrecord_ai_preinvoice_order",null,"is",salesOrder));
    filtros.push(new nlobjSearchFilter("custrecord_ai_preinvoice_fulfillmentline",null,"is",fulfillmentLineRel));

    var search = nlapiSearchRecord('customrecord_ai_historic_preinvoice', null, filtros, null);
    var id = '';
    
    for ( var i = 0; search != null && i < search.length; i++ ){
        id = search[i].id;
    }
    nlapiLogExecution('DEBUG', 'Id', id);
    return id; 
}

//------------------------------------------------------------------------------------------------------
// SLV (06/06/2023)
// Función que devuelve el sumatorio del histórico para la prefactura
//------------------------------------------------------------------------------------------------------
function getCantidadPrefactura(prefactura) {

    nlapiLogExecution('DEBUG', 'Inicio funcion get cantidad prefactura');
    var cantidad = 0;

    var filters = new Array();
    filters.push(new nlobjSearchFilter('custrecord_ai_preinvoice_invoice', null, 'anyof', prefactura));
 
    var columns = new Array();
    columns.push(new nlobjSearchColumn('custrecord_ai_preinvoice_qty', null, 'SUM'));
    
    var pr= nlapiSearchRecord('customrecord_ai_historic_preinvoice', null, filters, columns);

    if (pr && pr.length > 0){
        cantidad = pr[0].getValue('custrecord_ai_preinvoice_qty', null, 'SUM');
    }

    nlapiLogExecution('DEBUG', 'Cantidad prefactura: ', cantidad);
    return cantidad;
}
